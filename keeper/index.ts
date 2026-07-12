import "dotenv/config";
import httpModule from "http";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Hex,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── ABI Definitions ────────────────────────────────────────────────────────

const ROUND_MARKET_ABI = [
  { type: "function", name: "pair", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "currentRoundId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "roundDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "lockBuffer", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getRound",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "roundId", type: "uint256" },
          { name: "startPrice", type: "int256" },
          { name: "closePrice", type: "int256" },
          { name: "totalUpAmount", type: "uint256" },
          { name: "totalDownAmount", type: "uint256" },
          { name: "startTimestamp", type: "uint256" },
          { name: "lockTimestamp", type: "uint256" },
          { name: "endTimestamp", type: "uint256" },
          { name: "rewardBaseCalAmount", type: "uint256" },
          { name: "rewardAmount", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "canceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "openRound",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "lockRound",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "lockPrice", type: "int256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "lockAndOpenRound",
    inputs: [
      { name: "roundToLock", type: "uint256" },
      { name: "lockPrice", type: "int256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveRound",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "closePrice", type: "int256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ─── Constants ──────────────────────────────────────────────────────────────

const LOW_BALANCE_THRESHOLD = 0.5; // warn if below 0.5 native token
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2_000;
const ERROR_COOLDOWN_MS = 10_000;
const RESOLVE_TO_OPEN_DELAY_MS = 2_000;
const END_BUFFER_MS = 2_000; // extra buffer past endTimestamp

// ─── ARC Testnet Chain Definition ───────────────────────────────────────────

const arcTestnet: Chain = {
  id: 5_042_002,
  name: "ARC Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arc-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "ARC Explorer", url: "https://explorer.testnet.arc.network" },
  },
};

// ─── Round Type ─────────────────────────────────────────────────────────────

interface RoundData {
  roundId: bigint;
  startPrice: bigint;
  closePrice: bigint;
  totalUpAmount: bigint;
  totalDownAmount: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  endTimestamp: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  resolved: boolean;
  canceled: boolean;
}

// ─── Logger ─────────────────────────────────────────────────────────────────

function log(emoji: string, message: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${emoji}  ${message}`);
}

// ─── Config ─────────────────────────────────────────────────────────────────

function loadConfig() {
  const rpc = process.env.ARC_TESTNET_RPC ?? "https://arc-testnet.drpc.org";
  const privateKey = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const marketAddress = "0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938";

  if (!privateKey) {
    throw new Error("KEEPER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY is required. Set it in .env");
  }

  return {
    rpc,
    privateKey: (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex,
    marketAddress: marketAddress as Address,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      log(
        "⚠️",
        `${label} failed (attempt ${attempt}/${maxRetries}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      if (attempt < maxRetries) {
        log("⏳", `Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// ─── Price Fetching ──────────────────────────────────────────────────────────

/**
 * Fetch price from Binance API and format to 8 decimals (as standard oracle representation).
 */
/**
 * Fetch price using Pyth Hermes API as primary source (rate-limit friendly and doesn't block cloud IPs like Render/AWS).
 * Falls back to Binance and then CoinGecko if Hermes is down.
 * Formats price to 8 decimals as standard oracle representation.
 */
async function fetchPrice(pairName: string): Promise<bigint> {
  log("🔮", `Fetching price for ${pairName}...`);

  // 1. Try Pyth Hermes API first (Highly reliable, no cloud IP blocks)
  try {
    let feedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // Default BTC/USD
    const envFeedId = process.env.PRICE_FEED_ID;
    if (envFeedId) {
      feedId = envFeedId.startsWith("0x") ? envFeedId.substring(2) : envFeedId;
    } else {
      const pairUpper = pairName.toUpperCase();
      if (pairUpper === "ETH/USD") {
        feedId = "ff6d0bb2e285473e5311d9d3caacb525ae3538a8";
      } else if (pairUpper === "SOL/USD") {
        feedId = "ef0d8b6ffd224f8d5c02b18169902bd6f1214e3057ab65d83a1045509287ec50";
      }
    }

    log("🔮", `Querying Pyth Hermes Feed: ${feedId}...`);
    const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      throw new Error(`Hermes API returned status ${res.status}`);
    }
    const data = await res.json() as any;
    const priceStr = data.parsed[0].price.price;
    const expo = data.parsed[0].price.expo; // e.g. -8
    
    let priceVal = BigInt(priceStr);
    
    // Scale to standard 8 decimals if needed
    const targetDecimals = 8;
    const currentDecimals = -expo;
    if (currentDecimals > targetDecimals) {
      priceVal = priceVal / BigInt(10 ** (currentDecimals - targetDecimals));
    } else if (currentDecimals < targetDecimals) {
      priceVal = priceVal * BigInt(10 ** (targetDecimals - currentDecimals));
    }
    
    const floatPrice = Number(priceVal) / 1e8;
    log("📈", `Pyth Hermes Price: $${floatPrice} (Scaled: ${priceVal})`);
    return priceVal;
  } catch (err) {
    log("⚠️", `Pyth Hermes fetch failed: ${err instanceof Error ? err.message : String(err)}. Trying Binance...`);
  }

  // 2. Fallback to Binance (Might block AWS/Render hosting IPs)
  let symbol = "BTCUSDT";
  if (pairName.toUpperCase() === "ETH/USD") {
    symbol = "ETHUSDT";
  } else if (pairName.toUpperCase() === "SOL/USD") {
    symbol = "SOLUSDT";
  }

  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      throw new Error(`Binance API returned status ${res.status}`);
    }
    const data = await res.json() as { price: string };
    const floatPrice = parseFloat(data.price);
    const priceVal = BigInt(Math.round(floatPrice * 1e8));
    log("📈", `Binance Price: $${floatPrice} (Scaled: ${priceVal})`);
    return priceVal;
  } catch (err) {
    log("⚠️", `Binance fetch failed: ${err instanceof Error ? err.message : String(err)}. Trying CoinGecko...`);
  }

  // 3. Fallback to CoinGecko (Has strict rate limit for free tier)
  try {
    let cgId = "bitcoin";
    if (pairName.toUpperCase() === "ETH/USD") {
      cgId = "ethereum";
    } else if (pairName.toUpperCase() === "SOL/USD") {
      cgId = "solana";
    }
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      throw new Error(`CoinGecko API returned status ${res.status}`);
    }
    const data = await res.json() as any;
    const floatPrice = data[cgId].usd;
    const priceVal = BigInt(Math.round(floatPrice * 1e8));
    log("📈", `CoinGecko Price: $${floatPrice} (Scaled: ${priceVal})`);
    return priceVal;
  } catch (err) {
    log("❌", `All price sources failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

// ─── Keeper Bot ─────────────────────────────────────────────────────────────

let isRunning = true;

async function main() {
  log("🚀", "dotMarket Keeper Bot starting (No Pyth)...");

  // ── Load config ──
  const config = loadConfig();
  log("⚙️", `RPC: ${config.rpc}`);
  log("⚙️", `Market: ${config.marketAddress}`);

  // ── Set up viem clients ──
  const account = privateKeyToAccount(config.privateKey);
  log("🔑", `Keeper address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(config.rpc, { timeout: 15000 }),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(config.rpc, { timeout: 15000 }),
  });

  // ── Check balance ──
  const balance = await withRetry("Initial getBalance", () => publicClient.getBalance({ address: account.address }));
  const balanceEth = parseFloat(formatEther(balance));
  log("💎", `Keeper balance: ${formatEther(balance)} ETH`);
  if (balanceEth < LOW_BALANCE_THRESHOLD) {
    log(
      "🚨",
      `WARNING: Balance is below ${LOW_BALANCE_THRESHOLD} ETH! Fund the keeper wallet to avoid failures.`
    );
  }

  // ── Read contract params ──
  const pair = await withRetry("Read pair", () => publicClient.readContract({
    address: config.marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: "pair",
  }));
  log("💱", `Trading Pair: ${pair}`);

  const roundDuration = await withRetry("Read roundDuration", () => publicClient.readContract({
    address: config.marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: "roundDuration",
  }));
  log("📐", `Round duration: ${roundDuration}s`);

  const lockBuffer = await withRetry("Read lockBuffer", () => publicClient.readContract({
    address: config.marketAddress,
    abi: ROUND_MARKET_ABI,
    functionName: "lockBuffer",
  }));
  log("🔒", `Lock buffer: ${lockBuffer}s`);

  log("✅", "Keeper initialized. Entering main loop...\n");

  // ─── Main Loop ─────────────────────────────────────────────────────────
  while (isRunning) {
    try {
      // 1. Read current round ID with retry
      const currentRoundId = await withRetry("Read currentRoundId", () =>
        publicClient.readContract({
          address: config.marketAddress,
          abi: ROUND_MARKET_ABI,
          functionName: "currentRoundId",
        })
      );

      log("📊", `Current round ID: ${currentRoundId}`);

      const nowSec = BigInt(Math.floor(Date.now() / 1000));

      // 2. If no round exists (id == 0) → open the first round
      if (currentRoundId === 0n) {
        log("🆕", "No active round found. Opening the first round...");
        await withRetry("openRound (genesis)", async () => {
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "openRound",
            gas: 1000000n,
          });
          log("📤", `openRound tx sent: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          log("✅", `Genesis round opened! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
        });
        await sleep(5000);
        continue;
      }

      // 3. Fetch current round data with retry
      const currentRound = await withRetry(`Fetch currentRound #${currentRoundId}`, () =>
        publicClient.readContract({
          address: config.marketAddress,
          abi: ROUND_MARKET_ABI,
          functionName: "getRound",
          args: [currentRoundId],
        })
      ) as unknown as RoundData;

      log(
        "📋",
        `Round #${currentRound.roundId} | resolved=${currentRound.resolved} | canceled=${currentRound.canceled} | lockTimestamp=${currentRound.lockTimestamp} | endTimestamp=${currentRound.endTimestamp} | now=${nowSec}`
      );

      // ── STEP 0: If current round is already resolved or canceled, open next round ──
      if (currentRound.resolved || currentRound.canceled) {
        log("🔄", `Current round #${currentRoundId} is already settled/resolved. Opening the next round...`);
        await withRetry("openRound (after current resolved)", async () => {
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "openRound",
            gas: 1000000n,
          });
          log("📤", `openRound tx sent: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          log("✅", `New round opened! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
        });
        await sleep(5000);
        continue;
      }

      // ── STEP A: Resolve + open next round if current round has ended ───────
      // This handles the case where the current round has passed its endTimestamp
      // but hasn't been resolved yet. It requires startPrice > 0 (already locked).
      if (
        !currentRound.resolved &&
        !currentRound.canceled &&
        currentRound.startPrice > 0n &&
        nowSec >= currentRound.endTimestamp + BigInt(END_BUFFER_MS / 1000)
      ) {
        log("⏰", `Round #${currentRoundId} has ended (endTimestamp past). Resolving and opening next round...`);

        // Resolve the current round
        await withRetry(`resolveRound #${currentRoundId}`, async () => {
          const price = await fetchPrice(pair);
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "resolveRound",
            args: [currentRoundId, price],
            gas: 1000000n,
          });
          log("📤", `resolveRound #${currentRoundId} tx sent: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          log("✅", `Round #${currentRoundId} resolved! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
        });

        await sleep(RESOLVE_TO_OPEN_DELAY_MS);

        // Open the next round
        await withRetry("openRound (after resolve)", async () => {
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "openRound",
            gas: 1000000n,
          });
          log("📤", `openRound tx sent: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          log("✅", `New round opened! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
        });

        await sleep(5000);
        continue;
      }

      // ── STEP B: Lock current round + open next if lock time has passed ─────
      // startPrice === 0n means the round has NOT been locked yet
      if (
        !currentRound.resolved &&
        !currentRound.canceled &&
        currentRound.startPrice === 0n &&
        nowSec >= currentRound.lockTimestamp
      ) {
        log("🔒", `Round #${currentRoundId} has reached lock time. Locking and opening next round...`);
        await withRetry(`lockAndOpenRound #${currentRoundId}`, async () => {
          const price = await fetchPrice(pair);
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "lockAndOpenRound",
            args: [currentRoundId, price],
            gas: 1000000n,
          });
          log("📤", `lockAndOpenRound tx sent: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          log("✅", `Round #${currentRoundId} locked & next opened! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
        });
        await sleep(5000);
        continue;
      }

      // ── STEP C: Check and resolve previous rounds that slipped through ─────
      // Scan up to 10 rounds back. Use continue instead of break so a single stuck round doesn't block resolution of others.
      const scanLimit = currentRoundId - 10n > 0n ? currentRoundId - 10n : 1n;
      for (let prevId = currentRoundId - 1n; prevId >= scanLimit; prevId--) {
        let prevRound = await withRetry(`Fetch prevRound #${prevId}`, () =>
          publicClient.readContract({
            address: config.marketAddress,
            abi: ROUND_MARKET_ABI,
            functionName: "getRound",
            args: [prevId],
          })
        ) as unknown as RoundData;

        if (prevRound.resolved || prevRound.canceled) continue;

        if (nowSec >= prevRound.endTimestamp + BigInt(END_BUFFER_MS / 1000)) {
          // If the previous round was never locked, lock it first!
          if (prevRound.startPrice === 0n) {
            log("🔒", `Previous Round #${prevId} was never locked. Locking now before resolution...`);
            await withRetry(`lockRound #${prevId}`, async () => {
              const price = await fetchPrice(pair);
              const hash = await walletClient.writeContract({
                address: config.marketAddress,
                abi: ROUND_MARKET_ABI,
                functionName: "lockRound",
                args: [prevId, price],
                gas: 1000000n,
              });
              log("📤", `lockRound #${prevId} tx sent: ${hash}`);
              const receipt = await publicClient.waitForTransactionReceipt({ hash });
              log("✅", `Round #${prevId} locked! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
            });
            // Refresh round details
            prevRound = await withRetry(`Refetch prevRound #${prevId}`, () =>
              publicClient.readContract({
                address: config.marketAddress,
                abi: ROUND_MARKET_ABI,
                functionName: "getRound",
                args: [prevId],
              })
            ) as unknown as RoundData;
          }

          log("⏰", `Previous Round #${prevId} has ended. Resolving...`);
          await withRetry(`resolveRound #${prevId}`, async () => {
            const price = await fetchPrice(pair);
            const hash = await walletClient.writeContract({
              address: config.marketAddress,
              abi: ROUND_MARKET_ABI,
              functionName: "resolveRound",
              args: [prevId, price],
              gas: 1000000n,
            });
            log("📤", `resolveRound #${prevId} tx sent: ${hash}`);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            log("✅", `Round #${prevId} resolved! Gas used: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
          });
        }
      }

      // 6. Sleep for a short polling interval (10 seconds to avoid RPC rate limiting)
      await sleep(10000);
    } catch (err) {
      log(
        "❌",
        `Unhandled error in main loop: ${err instanceof Error ? err.message : String(err)}`
      );
      if (err instanceof Error && err.stack) {
        console.error(err.stack);
      }
      log("⏳", `Cooling down for ${ERROR_COOLDOWN_MS / 1000}s before retry...`);
      await sleep(ERROR_COOLDOWN_MS);
    }
  }

  log("👋", "Keeper bot shut down gracefully.");
}

// ─── Dummy Web Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
const server = httpModule.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Keeper is healthy and running\n");
});
server.listen(PORT, () => {
  log("🌐", `Dummy health-check server listening on port ${PORT}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

function shutdown(signal: string) {
  log("🛑", `Received ${signal}. Shutting down...`);
  isRunning = false;
  server.close(() => {
    log("🌐", "Dummy health-check server closed.");
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Entrypoint ─────────────────────────────────────────────────────────────

main().catch((err) => {
  log("💀", `Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
