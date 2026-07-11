import "dotenv/config";
import httpModule from "http";
import fs from "fs";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Hex,
  type Address,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── ABI Definitions ────────────────────────────────────────────────────────

const CONTINUOUS_MARKET_ABI = [
  { type: "function", name: "pair", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "totalBetsCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "minBetAmount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "protocolFeeBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getBet",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "betId", type: "uint256" },
          { name: "user", type: "address" },
          { name: "position", type: "uint8" },
          { name: "stake", type: "uint256" },
          { name: "entryTime", type: "uint256" },
          { name: "expiryTime", type: "uint256" },
          { name: "entryPrice", type: "int256" },
          { name: "settlementPrice", type: "int256" },
          { name: "lockedMultiplier", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "payout", type: "uint256" },
          { name: "claimed", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pushPrice",
    inputs: [{ name: "price", type: "int256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveBet",
    inputs: [
      { name: "betId", type: "uint256" },
      { name: "settlementPrice", type: "int256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ─── Constants ──────────────────────────────────────────────────────────────

const LOW_BALANCE_THRESHOLD = 0.5;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2_000;
const ERROR_COOLDOWN_MS = 10_000;

// ─── ARC Testnet Chain Definition ───────────────────────────────────────────

const arcTestnet: Chain = {
  id: 5_042_002,
  name: "ARC Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ARC Explorer", url: "https://explorer.testnet.arc.network" },
  },
};

// ─── Bet Structure ──────────────────────────────────────────────────────────

interface BetData {
  betId: bigint;
  user: Address;
  position: number;
  stake: bigint;
  entryTime: bigint;
  expiryTime: bigint;
  entryPrice: bigint;
  settlementPrice: bigint;
  lockedMultiplier: bigint;
  status: number;
  payout: bigint;
  claimed: boolean;
}

// ─── Logger ─────────────────────────────────────────────────────────────────

function log(emoji: string, message: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${emoji}  ${message}`);
}

// ─── Config ─────────────────────────────────────────────────────────────────

function loadConfig() {
  const rpc = process.env.ARC_TESTNET_RPC ?? "https://rpc.testnet.arc.network";
  const privateKey = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const marketAddress = process.env.MARKET_ADDRESS ?? "0xf65e0aF47FDC3d05186f33194B897584248703cd";

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

// State Persistence for Queue pointer
const POINTER_FILE = path.join(__dirname, "firstRunningBetId.txt");

function savePointer(id: bigint) {
  try {
    fs.writeFileSync(POINTER_FILE, id.toString(), "utf8");
  } catch (err) {
    log("⚠️", `Failed to save pointer: ${err}`);
  }
}

function loadPointer(): bigint {
  try {
    if (fs.existsSync(POINTER_FILE)) {
      const val = fs.readFileSync(POINTER_FILE, "utf8").trim();
      return BigInt(val);
    }
  } catch (err) {
    log("⚠️", `Failed to load pointer: ${err}`);
  }
  return 1n;
}

// ─── Price Fetching ──────────────────────────────────────────────────────────

async function fetchPrice(pairName: string): Promise<bigint> {
  // Try Pyth Hermes API
  try {
    const feedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // Default BTC/USD
    const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json() as any;
      const priceStr = data.parsed[0].price.price;
      const expo = data.parsed[0].price.expo;
      let priceVal = BigInt(priceStr);
      const targetDecimals = 8;
      const currentDecimals = -expo;
      if (currentDecimals > targetDecimals) {
        priceVal = priceVal / BigInt(10 ** (currentDecimals - targetDecimals));
      } else if (currentDecimals < targetDecimals) {
        priceVal = priceVal * BigInt(10 ** (targetDecimals - currentDecimals));
      }
      return priceVal;
    }
  } catch (err) {}

  // Fallback to Binance live price
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`, {
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json() as { price: string };
      return BigInt(Math.round(parseFloat(data.price) * 1e8));
    }
  } catch (err) {}

  throw new Error("Failed to fetch live price");
}

async function fetchHistoricalPrice(timestamp: number): Promise<bigint> {
  // 1. Try Pyth Benchmarks API
  try {
    const feedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
    const res = await fetch(`https://benchmarks.pyth.network/v1/updates/price/${timestamp}?ids[]=${feedId}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json() as any;
      const priceStr = data.parsed[0].price.price;
      const expo = data.parsed[0].price.expo;
      let priceVal = BigInt(priceStr);
      const targetDecimals = 8;
      const currentDecimals = -expo;
      if (currentDecimals > targetDecimals) {
        priceVal = priceVal / BigInt(10 ** (currentDecimals - targetDecimals));
      } else if (currentDecimals < targetDecimals) {
        priceVal = priceVal * BigInt(10 ** (targetDecimals - currentDecimals));
      }
      return priceVal;
    }
  } catch (err) {}

  // 2. Try Binance 1-second historical Klines
  try {
    const startTime = timestamp * 1000;
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1s&startTime=${startTime}&limit=1`, {
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const klines = await res.json() as any[];
      if (klines && klines.length > 0) {
        const closePrice = parseFloat(klines[0][4]);
        return BigInt(Math.round(closePrice * 1e8));
      }
    }
  } catch (err) {}

  // 3. Last fallback: live price
  return await fetchPrice("BTC/USD");
}

// ─── Keeper Bot ─────────────────────────────────────────────────────────────

let isRunning = true;

async function main() {
  log("🚀", "dotMarket Continuous Keeper Bot starting...");

  const config = loadConfig();
  log("⚙️", `RPC: ${config.rpc}`);
  log("⚙️", `Market: ${config.marketAddress}`);

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

  const balance = await withRetry("Initial balance check", () => publicClient.getBalance({ address: account.address }));
  log("💎", `Keeper balance: ${formatEther(balance)} USDC`);

  let firstRunningBetId = loadPointer();
  log("📌", `Loaded starting resolve bet pointer ID: ${firstRunningBetId}`);

  // Loop timers
  let lastPricePushTime = 0;

  while (isRunning) {
    try {
      const nowSec = Math.floor(Date.now() / 1000);

      // ─── A. Push Price to Contract ───
      // Push price every 6 seconds to keep reference price fresh on-chain
      if (nowSec - lastPricePushTime >= 6) {
        const livePrice = await fetchPrice("BTC/USD");
        log("📈", `Live reference price fetched: $${(Number(livePrice) / 1e8).toFixed(2)}`);

        await withRetry("pushPrice", async () => {
          const hash = await walletClient.writeContract({
            address: config.marketAddress,
            abi: CONTINUOUS_MARKET_ABI,
            functionName: "pushPrice",
            args: [livePrice],
            gas: 1000000n,
          });
          log("📤", `pushPrice tx sent: ${hash}`);
          await publicClient.waitForTransactionReceipt({ hash });
        });
        lastPricePushTime = nowSec;
      }

      // ─── B. Resolve Expired Bets ───
      const totalBetsCount = await withRetry("Read totalBetsCount", () =>
        publicClient.readContract({
          address: config.marketAddress,
          abi: CONTINUOUS_MARKET_ABI,
          functionName: "totalBetsCount",
        })
      );

      if (totalBetsCount >= firstRunningBetId) {
        for (let betId = firstRunningBetId; betId <= totalBetsCount; betId++) {
          const bet = await withRetry(`Fetch bet #${betId}`, () =>
            publicClient.readContract({
              address: config.marketAddress,
              abi: CONTINUOUS_MARKET_ABI,
              functionName: "getBet",
              args: [betId],
            })
          ) as unknown as BetData;

          // Status: 0 = Running, 1 = Won, 2 = Lost, 3 = Push
          if (bet.status === 0) {
            if (BigInt(nowSec) >= bet.expiryTime) {
              log("⏰", `Bet #${betId} has expired. Expiry: ${bet.expiryTime}. Resolving...`);
              
              const settlementPrice = await fetchHistoricalPrice(Number(bet.expiryTime));
              log("📈", `Historical price at expiry: $${(Number(settlementPrice) / 1e8).toFixed(2)}`);

              await withRetry(`resolveBet #${betId}`, async () => {
                const hash = await walletClient.writeContract({
                  address: config.marketAddress,
                  abi: CONTINUOUS_MARKET_ABI,
                  functionName: "resolveBet",
                  args: [betId, settlementPrice],
                  gas: 1000000n,
                });
                log("📤", `resolveBet #${betId} tx sent: ${hash}`);
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                log("✅", `Bet #${betId} resolved! Gas used: ${receipt.gasUsed}`);
              });
            } else {
              // Remaining bets are not expired yet (since IDs are chronological)
              break;
            }
          }

          if (bet.status !== 0 && betId === firstRunningBetId) {
            firstRunningBetId++;
            savePointer(firstRunningBetId);
          }
        }
      }

      // Sleep 3 seconds before next iteration
      await sleep(3000);
    } catch (err) {
      log(
        "❌",
        `Unhandled error in main loop: ${err instanceof Error ? err.message : String(err)}`
      );
      await sleep(ERROR_COOLDOWN_MS);
    }
  }
}

// ─── Dummy Web Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
const server = httpModule.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Continuous Keeper is healthy\n");
});
server.listen(PORT, () => {
  log("🌐", `Dummy health server listening on port ${PORT}`);
});

// Graceful Shutdown
function shutdown(signal: string) {
  log("🛑", `Received ${signal}. Shutting down...`);
  isRunning = false;
  server.close();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  log("💀", `Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
