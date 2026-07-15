"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
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
];
// ─── Constants ──────────────────────────────────────────────────────────────
const LOW_BALANCE_THRESHOLD = 0.5;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000;
const ERROR_COOLDOWN_MS = 15000;
const RESOLVE_TO_OPEN_DELAY_MS = 3000;
const END_BUFFER_MS = 2000;
// ── Polling interval: only 2 reads per loop (currentRoundId + getRound).
// 15s is safe for any public RPC — well under rate limits.
const POLL_INTERVAL_MS = 15000;
// ─── RPC Endpoints (priority order, no rate-limited Arc RPC) ────────────────
// Thirdweb & drpc are reliable public RPCs for ARC testnet without strict limits.
const RPC_ENDPOINTS = [
    "https://5042002.rpc.thirdweb.com", // Primary: Thirdweb (no rate limit)
    "https://arc-testnet.drpc.org", // Fallback 1: dRPC
];
// ─── ARC Testnet Chain Definition ───────────────────────────────────────────
const arcTestnet = {
    id: 5042002,
    name: "ARC Testnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: {
        default: { http: [RPC_ENDPOINTS[0]] },
    },
    blockExplorers: {
        default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
    },
};
// ─── Logger ─────────────────────────────────────────────────────────────────
function log(emoji, message) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${emoji}  ${message}`);
}
// ─── Config ─────────────────────────────────────────────────────────────────
function loadConfig() {
    // Use Thirdweb RPC as default — no rate limits, reliable
    const rpc = process.env.ARC_TESTNET_RPC ?? RPC_ENDPOINTS[0];
    const privateKey = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    const marketAddress = process.env.MARKET_ADDRESS ?? "0xA801878f362D7c0093Fd96B6616b33812c28ce8E";
    if (!privateKey) {
        throw new Error("KEEPER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY is required. Set it in .env");
    }
    return {
        rpc,
        privateKey: (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`),
        marketAddress: marketAddress,
    };
}
// ─── Helpers ────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry with exponential backoff. Pauses between attempts to avoid rate limits.
 */
async function withRetry(label, fn, maxRetries = MAX_RETRIES) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
            log("⚠️", `${label} failed (attempt ${attempt}/${maxRetries}): ${err instanceof Error ? err.message : String(err)}`);
            if (attempt < maxRetries) {
                log("⏳", `Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
// ─── Price Fetching ──────────────────────────────────────────────────────────
async function fetchPrice(pairName) {
    log("🔮", `Fetching price for ${pairName}...`);
    // 1. Try Pyth Hermes API first (no cloud IP blocks, no rate limit issues)
    try {
        let feedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD
        const envFeedId = process.env.PRICE_FEED_ID;
        if (envFeedId) {
            feedId = envFeedId.startsWith("0x") ? envFeedId.substring(2) : envFeedId;
        }
        else {
            const pairUpper = pairName.toUpperCase();
            if (pairUpper === "ETH/USD") {
                feedId = "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
            }
            else if (pairUpper === "SOL/USD") {
                feedId = "ef0d8b6ffd224f8d5c02b18169902bd6f1214e3057ab65d83a1045509287ec50";
            }
        }
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`, { signal: AbortSignal.timeout(10000) });
        if (!res.ok)
            throw new Error(`Hermes API returned status ${res.status}`);
        const data = await res.json();
        const priceStr = data.parsed[0].price.price;
        const expo = data.parsed[0].price.expo;
        let priceVal = BigInt(priceStr);
        const targetDecimals = 8;
        const currentDecimals = -expo;
        if (currentDecimals > targetDecimals) {
            priceVal = priceVal / BigInt(10 ** (currentDecimals - targetDecimals));
        }
        else if (currentDecimals < targetDecimals) {
            priceVal = priceVal * BigInt(10 ** (targetDecimals - currentDecimals));
        }
        log("📈", `Pyth Price: $${(Number(priceVal) / 1e8).toFixed(2)}`);
        return priceVal;
    }
    catch (err) {
        log("⚠️", `Pyth Hermes failed: ${err instanceof Error ? err.message : String(err)}. Trying Binance...`);
    }
    // 2. Fallback: Binance
    let symbol = "BTCUSDT";
    if (pairName.toUpperCase() === "ETH/USD")
        symbol = "ETHUSDT";
    else if (pairName.toUpperCase() === "SOL/USD")
        symbol = "SOLUSDT";
    try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok)
            throw new Error(`Binance API returned status ${res.status}`);
        const data = await res.json();
        const priceVal = BigInt(Math.round(parseFloat(data.price) * 1e8));
        log("📈", `Binance Price: $${(Number(priceVal) / 1e8).toFixed(2)}`);
        return priceVal;
    }
    catch (err) {
        log("⚠️", `Binance failed: ${err instanceof Error ? err.message : String(err)}. Trying CoinGecko...`);
    }
    // 3. Last resort: CoinGecko
    let cgId = "bitcoin";
    if (pairName.toUpperCase() === "ETH/USD")
        cgId = "ethereum";
    else if (pairName.toUpperCase() === "SOL/USD")
        cgId = "solana";
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok)
        throw new Error(`CoinGecko API returned status ${res.status}`);
    const data = await res.json();
    const priceVal = BigInt(Math.round(data[cgId].usd * 1e8));
    log("📈", `CoinGecko Price: $${(Number(priceVal) / 1e8).toFixed(2)}`);
    return priceVal;
}
// ─── Keeper State ────────────────────────────────────────────────────────────
let isRunning = true;
// Track which previous round IDs we've already scanned to avoid redundant calls
const resolvedRoundCache = new Set();
async function main() {
    log("🚀", "dotMarket Keeper Bot starting...");
    const config = loadConfig();
    log("⚙️", `RPC: ${config.rpc}`);
    log("⚙️", `Market: ${config.marketAddress}`);
    const account = (0, accounts_1.privateKeyToAccount)(config.privateKey);
    log("🔑", `Keeper address: ${account.address}`);
    // ── Build client with primary RPC; falls back to drpc on transport error ──
    const publicClient = (0, viem_1.createPublicClient)({
        chain: arcTestnet,
        transport: (0, viem_1.http)(config.rpc, {
            timeout: 20000,
            retryCount: 2,
            retryDelay: 2000,
        }),
    });
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: arcTestnet,
        transport: (0, viem_1.http)(config.rpc, {
            timeout: 20000,
            retryCount: 2,
            retryDelay: 2000,
        }),
    });
    // ── Check balance ──
    const balance = await withRetry("Initial getBalance", () => publicClient.getBalance({ address: account.address }));
    log("💎", `Keeper balance: ${(0, viem_1.formatEther)(balance)} ETH`);
    if (parseFloat((0, viem_1.formatEther)(balance)) < LOW_BALANCE_THRESHOLD) {
        log("🚨", `WARNING: Balance below ${LOW_BALANCE_THRESHOLD} ETH! Fund the keeper wallet.`);
    }
    // ── Read contract params once at startup ──
    // ── Read contract params once at startup ──
    const pair = await withRetry("Read pair", () => publicClient.readContract({
        address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "pair",
    }));
    const roundDuration = await withRetry("Read roundDuration", () => publicClient.readContract({
        address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "roundDuration",
    }));
    const lockBuffer = await withRetry("Read lockBuffer", () => publicClient.readContract({
        address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "lockBuffer",
    }));
    log("💱", `Pair: ${pair} | Round: ${roundDuration}s | LockBuffer: ${lockBuffer}s`);
    log("✅", `Keeper initialized. Polling every ${POLL_INTERVAL_MS / 1000}s.\n`);
    // ─── Main Loop ─────────────────────────────────────────────────────────────
    // Each iteration makes exactly 2 RPC reads (currentRoundId + getRound).
    // Previous round scan only reads 1 round (currentId - 1), not 10.
    // This keeps RPC calls to ~2-3 per 15 seconds — well under any rate limit.
    // ──────────────────────────────────────────────────────────────────────────
    while (isRunning) {
        const loopStart = Date.now();
        try {
            // READ 1: currentRoundId
            const currentRoundId = await withRetry("Read currentRoundId", () => publicClient.readContract({
                address: config.marketAddress,
                abi: ROUND_MARKET_ABI,
                functionName: "currentRoundId",
            }));
            log("📊", `Current round ID: ${currentRoundId}`);
            let nowSec = BigInt(Math.floor(Date.now() / 1000));
            // ── Genesis: no rounds exist yet ──────────────────────────────────────
            if (currentRoundId === 0n) {
                log("🆕", "No active round. Opening genesis round...");
                await withRetry("openRound (genesis)", async () => {
                    const hash = await walletClient.writeContract({
                        address: config.marketAddress,
                        abi: ROUND_MARKET_ABI,
                        functionName: "openRound",
                        gas: 1000000n,
                    });
                    log("📤", `openRound tx: ${hash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                    log("✅", `Genesis round opened! Gas: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
                });
                await sleep(POLL_INTERVAL_MS);
                continue;
            }
            // READ 2: current round data
            const currentRound = await withRetry(`Fetch round #${currentRoundId}`, () => publicClient.readContract({
                address: config.marketAddress,
                abi: ROUND_MARKET_ABI,
                functionName: "getRound",
                args: [currentRoundId],
            }));
            nowSec = BigInt(Math.floor(Date.now() / 1000));
            log("📋", `Round #${currentRound.roundId} | locked=${currentRound.startPrice > 0n} | resolved=${currentRound.resolved} | canceled=${currentRound.canceled} | lockAt=${currentRound.lockTimestamp} | endAt=${currentRound.endTimestamp} | now=${nowSec}`);
            // ── Already settled → open next immediately ───────────────────────────
            if (currentRound.resolved || currentRound.canceled) {
                log("🔄", `Round #${currentRoundId} already settled. Opening next round...`);
                resolvedRoundCache.add(currentRoundId.toString());
                await withRetry("openRound (after settle)", async () => {
                    const hash = await walletClient.writeContract({
                        address: config.marketAddress,
                        abi: ROUND_MARKET_ABI,
                        functionName: "openRound",
                        gas: 1000000n,
                    });
                    log("📤", `openRound tx: ${hash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                    log("✅", `New round opened! Gas: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
                });
                await sleep(POLL_INTERVAL_MS);
                continue;
            }
            // ── STEP A: End time passed → resolve + open next ─────────────────────
            if (!currentRound.resolved &&
                !currentRound.canceled &&
                currentRound.startPrice > 0n &&
                nowSec >= currentRound.endTimestamp + BigInt(END_BUFFER_MS / 1000)) {
                log("⏰", `Round #${currentRoundId} ended. Resolving...`);
                const resolvePrice = await fetchPrice(pair);
                await withRetry(`resolveRound #${currentRoundId}`, async () => {
                    const hash = await walletClient.writeContract({
                        address: config.marketAddress,
                        abi: ROUND_MARKET_ABI,
                        functionName: "resolveRound",
                        args: [currentRoundId, resolvePrice],
                        gas: 1000000n,
                    });
                    log("📤", `resolveRound tx: ${hash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                    log("✅", `Round #${currentRoundId} resolved! Gas: ${receipt.gasUsed}`);
                });
                resolvedRoundCache.add(currentRoundId.toString());
                nowSec = BigInt(Math.floor(Date.now() / 1000));
                await sleep(RESOLVE_TO_OPEN_DELAY_MS);
                await withRetry("openRound (after resolve)", async () => {
                    const hash = await walletClient.writeContract({
                        address: config.marketAddress,
                        abi: ROUND_MARKET_ABI,
                        functionName: "openRound",
                        gas: 1000000n,
                    });
                    log("📤", `openRound tx: ${hash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                    log("✅", `New round opened! Gas: ${receipt.gasUsed}`);
                });
                await sleep(POLL_INTERVAL_MS);
                continue;
            }
            // ── STEP B: Lock time passed → lockAndOpen ────────────────────────────
            if (!currentRound.resolved &&
                !currentRound.canceled &&
                currentRound.startPrice === 0n &&
                nowSec >= currentRound.lockTimestamp) {
                log("🔒", `Round #${currentRoundId} at lock time. Locking and opening next...`);
                const lockPrice = await fetchPrice(pair);
                await withRetry(`lockAndOpenRound #${currentRoundId}`, async () => {
                    const hash = await walletClient.writeContract({
                        address: config.marketAddress,
                        abi: ROUND_MARKET_ABI,
                        functionName: "lockAndOpenRound",
                        args: [currentRoundId, lockPrice],
                        gas: 1000000n,
                    });
                    log("📤", `lockAndOpenRound tx: ${hash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                    log("✅", `Round #${currentRoundId} locked & next opened! Gas: ${receipt.gasUsed}`);
                });
                await sleep(POLL_INTERVAL_MS);
                continue;
            }
            // ── STEP C: Check ONLY the immediately previous round (not 10!) ───────
            // If it's not already in our resolved cache, check it once.
            // This uses exactly 1 extra RPC call only when needed.
            const prevId = currentRoundId - 1n;
            if (prevId > 0n && !resolvedRoundCache.has(prevId.toString())) {
                nowSec = BigInt(Math.floor(Date.now() / 1000));
                let prevRound = await withRetry(`Fetch prevRound #${prevId}`, () => publicClient.readContract({
                    address: config.marketAddress,
                    abi: ROUND_MARKET_ABI,
                    functionName: "getRound",
                    args: [prevId],
                }));
                if (prevRound.resolved || prevRound.canceled) {
                    // Cache it so we never fetch it again
                    resolvedRoundCache.add(prevId.toString());
                    log("💾", `Round #${prevId} already settled (cached).`);
                }
                else if (nowSec >= prevRound.endTimestamp + BigInt(END_BUFFER_MS / 1000)) {
                    // Prev round ended but not resolved — handle it
                    if (prevRound.startPrice === 0n) {
                        log("🔒", `Prev Round #${prevId} was never locked. Locking now...`);
                        const prevLockPrice = await fetchPrice(pair);
                        await withRetry(`lockRound #${prevId}`, async () => {
                            const hash = await walletClient.writeContract({
                                address: config.marketAddress,
                                abi: ROUND_MARKET_ABI,
                                functionName: "lockRound",
                                args: [prevId, prevLockPrice],
                                gas: 1000000n,
                            });
                            log("📤", `lockRound tx: ${hash}`);
                            const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                            log("✅", `Round #${prevId} locked! Gas: ${receipt.gasUsed}`);
                        });
                        prevRound = await withRetry(`Refetch prevRound #${prevId}`, () => publicClient.readContract({
                            address: config.marketAddress,
                            abi: ROUND_MARKET_ABI,
                            functionName: "getRound",
                            args: [prevId],
                        }));
                    }
                    log("⏰", `Prev Round #${prevId} ended. Resolving...`);
                    const prevResolvePrice = await fetchPrice(pair);
                    await withRetry(`resolveRound #${prevId}`, async () => {
                        const hash = await walletClient.writeContract({
                            address: config.marketAddress,
                            abi: ROUND_MARKET_ABI,
                            functionName: "resolveRound",
                            args: [prevId, prevResolvePrice],
                            gas: 1000000n,
                        });
                        log("📤", `resolveRound tx: ${hash}`);
                        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
                        log("✅", `Round #${prevId} resolved! Gas: ${receipt.gasUsed}`);
                    });
                    resolvedRoundCache.add(prevId.toString());
                }
                else {
                    // Prev round still live (not ended) — don't need to do anything
                    const secsUntilEnd = Number(prevRound.endTimestamp) - Number(nowSec);
                    log("ℹ️", `Round #${prevId} still settling. ${secsUntilEnd}s until end.`);
                }
            }
            // ── STEP D: Nothing to do. Calculate smart sleep until next event. ────
            nowSec = BigInt(Math.floor(Date.now() / 1000));
            const secsToLock = Number(currentRound.lockTimestamp) - Number(nowSec);
            const secsToEnd = Number(currentRound.endTimestamp) - Number(nowSec);
            const msToLock = secsToLock > 0 ? secsToLock * 1000 : Infinity;
            const msToEnd = secsToEnd > 0 ? secsToEnd * 1000 : Infinity;
            // Wake up 2s before the next event, but minimum 5s and maximum POLL_INTERVAL_MS
            const nextEventMs = Math.min(msToLock, msToEnd);
            const sleepMs = Math.max(5000, Math.min(POLL_INTERVAL_MS, nextEventMs - 2000));
            log("💤", `Nothing to do. Sleeping ${Math.round(sleepMs / 1000)}s (next event in ~${Math.round(nextEventMs / 1000)}s)`);
            await sleep(sleepMs);
        }
        catch (err) {
            log("❌", `Main loop error: ${err instanceof Error ? err.message : String(err)}`);
            if (err instanceof Error && err.stack)
                console.error(err.stack);
            log("⏳", `Cooling down ${ERROR_COOLDOWN_MS / 1000}s...`);
            await sleep(ERROR_COOLDOWN_MS);
        }
    }
    log("👋", "Keeper bot shut down gracefully.");
}
// ─── Health-check HTTP Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
const server = http_1.default.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Keeper is healthy and running\n");
});
server.listen(PORT, () => {
    log("🌐", `Health-check server on port ${PORT}`);
});
// ─── Graceful Shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
    log("🛑", `Received ${signal}. Shutting down...`);
    isRunning = false;
    server.close(() => log("🌐", "Health-check server closed."));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// ─── Entrypoint ─────────────────────────────────────────────────────────────
main().catch((err) => {
    log("💀", `Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    if (err instanceof Error && err.stack)
        console.error(err.stack);
    process.exit(1);
});
//# sourceMappingURL=index.js.map