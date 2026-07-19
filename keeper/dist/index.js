"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
// ── Guardian Integration ────────────────────────────────────────────────────
const state_1 = require("./guardian/state");
const monitor_1 = require("./guardian/monitor");
const routes_1 = require("./guardian/routes");
const logger_1 = require("./guardian/logger");
// ─── ABI ─────────────────────────────────────────────────────────────────────
const ROUND_MARKET_ABI = [
    { type: "function", name: "pair", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
    { type: "function", name: "currentRoundId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "roundDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "lockBuffer", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
    {
        type: "function", name: "getRound",
        inputs: [{ name: "roundId", type: "uint256" }],
        outputs: [{
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
            }],
        stateMutability: "view",
    },
    {
        type: "function", name: "openRound",
        inputs: [], outputs: [], stateMutability: "nonpayable",
    },
    {
        type: "function", name: "lockRound",
        inputs: [{ name: "roundId", type: "uint256" }, { name: "lockPrice", type: "int256" }],
        outputs: [], stateMutability: "nonpayable",
    },
    {
        type: "function", name: "resolveRound",
        inputs: [{ name: "roundId", type: "uint256" }, { name: "closePrice", type: "int256" }],
        outputs: [], stateMutability: "nonpayable",
    },
];
// ─── Constants ────────────────────────────────────────────────────────────────
const LOW_BALANCE_THRESHOLD = 0.5;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000;
const ERROR_COOLDOWN_MS = 10000;
/**
 * LOCK_GRACE_SECS / END_GRACE_SECS: seconds past the on-chain timestamp before we act.
 * Using block.timestamp (not Date.now) means we only fire when the chain agrees.
 * 2-3 seconds of grace ensures the tx will not revert on "not lockable yet".
 */
const LOCK_GRACE_SECS = 2n;
const END_GRACE_SECS = 3n;
/**
 * Between resolveRound confirming and openRound firing: wait 2s to let
 * indexers catch up and avoid any multicall edge cases.
 */
const RESOLVE_TO_OPEN_DELAY_MS = 2000;
/**
 * How frequently we poll for a new block when waiting for the next event.
 * 2s is safe for any public RPC and equals ~1 ARC Testnet block.
 */
const BLOCK_POLL_MS = 2000;
/**
 * If the next event is more than this many seconds away (by block timestamp),
 * sleep the surplus and only then begin block-by-block polling.
 */
const SMART_SLEEP_THRESHOLD_SECS = 10;
const GAS_LIMIT = 1000000n;
const RPC_ENDPOINTS = [
    "https://rpc.testnet.arc.network",
    "https://arc-testnet.drpc.org",
];
// Crash-recovery state file (survives process restarts)
const STATE_FILE = path.join(__dirname, "keeper-state.json");
// ─── Chain ───────────────────────────────────────────────────────────────────
const arcTestnet = {
    id: 5042002,
    name: "ARC Testnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_ENDPOINTS[0]] } },
    blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
};
// ─── Logger ──────────────────────────────────────────────────────────────────
function log(emoji, message) {
    console.log(`[${new Date().toISOString()}] ${emoji}  ${message}`);
}
// ─── Config ──────────────────────────────────────────────────────────────────
function loadConfig() {
    const rpc = process.env.ARC_TESTNET_RPC ?? RPC_ENDPOINTS[0];
    const privateKey = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    const marketAddr = process.env.MARKET_ADDRESS ?? "0xA801878f362D7c0093Fd96B6616b33812c28ce8E";
    if (!privateKey)
        throw new Error("KEEPER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY required in .env");
    return {
        rpc,
        privateKey: (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`),
        marketAddress: marketAddr,
    };
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function withRetry(label, fn, maxRetries = MAX_RETRIES) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
            log("⚠️", `${label} attempt ${attempt}/${maxRetries} failed: ${err instanceof Error ? err.message : String(err)}`);
            if (attempt < maxRetries) {
                log("⏳", `Retry in ${delay / 1000}s…`);
                await sleep(delay);
            }
        }
    }
    throw lastErr;
}
function loadPersistedState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const raw = fs.readFileSync(STATE_FILE, "utf8");
            const parsed = JSON.parse(raw);
            log("💾", `Loaded persisted state: round=${parsed.lastKnownRoundId} phase=${parsed.lastKnownPhase} (saved ${Math.floor((Date.now() - parsed.savedAt) / 1000)}s ago)`);
            return parsed;
        }
    }
    catch {
        log("⚠️", "Could not load persisted state file; starting fresh.");
    }
    return null;
}
function saveState(roundId, phase) {
    try {
        const state = {
            lastKnownRoundId: Number(roundId),
            lastKnownPhase: phase,
            savedAt: Date.now(),
        };
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    }
    catch (err) {
        log("⚠️", `Failed to save state: ${err instanceof Error ? err.message : String(err)}`);
    }
}
function derivePhase(blockTimestamp, roundId, round) {
    if (roundId === 0n)
        return "GENESIS";
    if (round.resolved || round.canceled)
        return "RESOLVED";
    const isLocked = round.startPrice > 0n;
    if (!isLocked) {
        if (blockTimestamp >= round.lockTimestamp + LOCK_GRACE_SECS)
            return "LOCKABLE";
        return "OPEN";
    }
    // isLocked = true
    if (blockTimestamp >= round.endTimestamp + END_GRACE_SECS)
        return "RESOLVABLE";
    return "LOCKED";
}
function phaseToAction(phase) {
    switch (phase) {
        case "GENESIS": return "OPEN_GENESIS";
        case "LOCKABLE": return "LOCK_ROUND";
        case "RESOLVABLE": return "RESOLVE_AND_OPEN";
        case "RESOLVED": return "OPEN_AFTER_RESOLVE";
        case "OPEN":
        case "LOCKED":
        default: return "WAIT";
    }
}
/** Seconds until the next expected action (from block timestamp) */
function secsToNextEvent(blockTimestamp, round) {
    const lockTarget = round.lockTimestamp + LOCK_GRACE_SECS;
    const endTarget = round.endTimestamp + END_GRACE_SECS;
    if (round.startPrice === 0n) {
        return lockTarget > blockTimestamp ? lockTarget - blockTimestamp : 0n;
    }
    return endTarget > blockTimestamp ? endTarget - blockTimestamp : 0n;
}
// ─── Price Fetch ──────────────────────────────────────────────────────────────
async function fetchPrice(pairName) {
    log("🔮", `Fetching price for ${pairName}…`);
    // Feed IDs
    let feedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
    const envFeed = process.env.PRICE_FEED_ID;
    if (envFeed) {
        feedId = envFeed.startsWith("0x") ? envFeed.substring(2) : envFeed;
    }
    else {
        const p = pairName.toUpperCase();
        if (p === "ETH/USD")
            feedId = "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
        if (p === "SOL/USD")
            feedId = "ef0d8b6ffd224f8d5c02b18169902bd6f1214e3057ab65d83a1045509287ec50";
    }
    // 1. Pyth Hermes
    try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok)
            throw new Error(`Hermes ${res.status}`);
        const data = await res.json();
        const { price: priceStr, expo } = data.parsed[0].price;
        let val = BigInt(priceStr);
        const dec = -expo;
        if (dec > 8)
            val = val / BigInt(10 ** (dec - 8));
        if (dec < 8)
            val = val * BigInt(10 ** (8 - dec));
        log("📈", `Pyth: $${(Number(val) / 1e8).toFixed(2)}`);
        return val;
    }
    catch (err) {
        log("⚠️", `Pyth failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    // 2. Binance
    const sym = pairName.toUpperCase() === "ETH/USD" ? "ETHUSDT"
        : pairName.toUpperCase() === "SOL/USD" ? "SOLUSDT"
            : "BTCUSDT";
    try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok)
            throw new Error(`Binance ${res.status}`);
        const data = await res.json();
        const val = BigInt(Math.round(parseFloat(data.price) * 1e8));
        log("📈", `Binance: $${(Number(val) / 1e8).toFixed(2)}`);
        return val;
    }
    catch (err) {
        log("⚠️", `Binance failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    // 3. CoinGecko
    const cgId = pairName.toUpperCase() === "ETH/USD" ? "ethereum"
        : pairName.toUpperCase() === "SOL/USD" ? "solana"
            : "bitcoin";
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok)
        throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const val = BigInt(Math.round(data[cgId].usd * 1e8));
    log("📈", `CoinGecko: $${(Number(val) / 1e8).toFixed(2)}`);
    return val;
}
// ─── Block-Aware Sleep ────────────────────────────────────────────────────────
//
// When we have time to kill before the next event:
//   1. If > SMART_SLEEP_THRESHOLD_SECS away → sleep most of the time
//   2. Then poll for new blocks every BLOCK_POLL_MS until block.timestamp advances
//
// This avoids hammering the RPC with getBlock() every 2s for a 50s wait, while
// still reacting to the chain quickly when the event window approaches.
async function waitUntilEvent(publicClient, marketAddress, targetBlockTs, label) {
    const blockNow = await withRetry("getBlock(wait)", () => publicClient.getBlock({ blockTag: "latest" }));
    const tsNow = blockNow.timestamp;
    const secsLeft = Number(targetBlockTs > tsNow ? targetBlockTs - tsNow : 0n);
    if (secsLeft > SMART_SLEEP_THRESHOLD_SECS) {
        const bulkSleepMs = (secsLeft - SMART_SLEEP_THRESHOLD_SECS + 1) * 1000;
        log("💤", `${label} in ~${secsLeft}s. Sleeping ${Math.round(bulkSleepMs / 1000)}s then polling blocks…`);
        // Split bulk sleep into max 5-second chunks to keep the heartbeat fresh
        let remainingMs = bulkSleepMs;
        while (remainingMs > 0) {
            const chunk = Math.min(5000, remainingMs);
            await sleep(chunk);
            (0, state_1.heartbeat)();
            remainingMs -= chunk;
        }
    }
    // Block-by-block polling for the final window
    let lastBlockNum = blockNow.number;
    let iterations = 0;
    while (true) {
        await sleep(BLOCK_POLL_MS);
        (0, state_1.heartbeat)(); // Keep heartbeat alive during block polling
        try {
            const block = await publicClient.getBlock({ blockTag: "latest" });
            if (block.number > lastBlockNum) {
                lastBlockNum = block.number;
                iterations++;
                if (block.timestamp >= targetBlockTs) {
                    log("🔔", `${label} — block ${block.number} has timestamp ${block.timestamp} >= target ${targetBlockTs}. Acting.`);
                    return;
                }
                const remaining = Number(targetBlockTs - block.timestamp);
                if (iterations % 5 === 0) {
                    log("⏱️", `Waiting for ${label}… ${remaining}s remaining (block ${block.number})`);
                }
            }
        }
        catch (err) {
            log("⚠️", `getBlock() during wait failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
/** Wait for the block number to advance by at least 1 after a tx */
async function waitForNextBlock(publicClient, currentBlockNumber, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await sleep(BLOCK_POLL_MS);
        try {
            const bn = await publicClient.getBlockNumber();
            if (bn > currentBlockNumber)
                return;
        }
        catch { /* ignore transient errors */ }
    }
    log("⚠️", "waitForNextBlock timed out — continuing anyway");
}
// ─── Idempotency-Guarded Actions ─────────────────────────────────────────────
//
// Every write function re-reads chain state immediately before sending
// the transaction. If the action is no longer needed, it is skipped.
// This prevents double-execution on retry and after keeper restarts.
async function doLockRound(publicClient, walletClient, account, marketAddress, roundId, pair) {
    // ── IDEMPOTENCY GUARD ──
    const block = await withRetry("getBlock(lock-guard)", () => publicClient.getBlock({ blockTag: "latest" }));
    const fresh = await withRetry("getRound(lock-guard)", () => publicClient.readContract({ address: marketAddress, abi: ROUND_MARKET_ABI, functionName: "getRound", args: [roundId] }));
    if (fresh.startPrice !== 0n) {
        log("✅", `Round #${roundId} already locked (startPrice=${fresh.startPrice}). Skipping.`);
        return;
    }
    if (block.timestamp < fresh.lockTimestamp) {
        log("⚠️", `lockRound guard: block.timestamp ${block.timestamp} < lockTimestamp ${fresh.lockTimestamp}. Too early.`);
        throw new Error("lockRound: block not past lockTimestamp yet");
    }
    const price = await fetchPrice(pair);
    log("🔒", `Locking round #${roundId} at price $${(Number(price) / 1e8).toFixed(2)}…`);
    const hash = await walletClient.writeContract({
        address: marketAddress,
        abi: ROUND_MARKET_ABI,
        functionName: "lockRound",
        args: [roundId, price],
        gas: GAS_LIMIT,
        chain: arcTestnet,
        account: account,
    });
    log("📤", `lockRound tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
    log("✅", `Round #${roundId} locked! Gas: ${receipt.gasUsed} Block: ${receipt.blockNumber}`);
    (0, state_1.recordTxSuccess)();
    (0, logger_1.logEvent)("BET_CLOSED", `Round #${roundId} locked at $${(Number(price) / 1e8).toFixed(2)}`, "healthy");
}
async function doResolveRound(publicClient, walletClient, account, marketAddress, roundId, pair) {
    // ── IDEMPOTENCY GUARD ──
    const block = await withRetry("getBlock(resolve-guard)", () => publicClient.getBlock({ blockTag: "latest" }));
    const fresh = await withRetry("getRound(resolve-guard)", () => publicClient.readContract({ address: marketAddress, abi: ROUND_MARKET_ABI, functionName: "getRound", args: [roundId] }));
    if (fresh.resolved || fresh.canceled) {
        log("✅", `Round #${roundId} already settled. Skipping resolveRound.`);
        return;
    }
    if (fresh.startPrice === 0n) {
        log("⚠️", `resolveRound guard: round #${roundId} not locked yet (startPrice=0). Cannot resolve.`);
        throw new Error("resolveRound: round not locked");
    }
    if (block.timestamp < fresh.endTimestamp) {
        log("⚠️", `resolveRound guard: block.timestamp ${block.timestamp} < endTimestamp ${fresh.endTimestamp}. Too early.`);
        throw new Error("resolveRound: block not past endTimestamp yet");
    }
    const price = await fetchPrice(pair);
    log("⏰", `Resolving round #${roundId} at price $${(Number(price) / 1e8).toFixed(2)}…`);
    const hash = await walletClient.writeContract({
        address: marketAddress,
        abi: ROUND_MARKET_ABI,
        functionName: "resolveRound",
        args: [roundId, price],
        gas: GAS_LIMIT,
        chain: arcTestnet,
        account: account,
    });
    log("📤", `resolveRound tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
    log("✅", `Round #${roundId} resolved! Gas: ${receipt.gasUsed} Block: ${receipt.blockNumber}`);
    (0, state_1.recordTxSuccess)();
    (0, state_1.recordSettlement)();
    (0, logger_1.logEvent)("SETTLEMENT_COMPLETE", `Round #${roundId} resolved at $${(Number(price) / 1e8).toFixed(2)}`, "healthy");
}
async function doOpenRound(publicClient, walletClient, account, marketAddress, currentRoundId, label) {
    // ── IDEMPOTENCY GUARD ──
    // Verify the current round is truly resolved before opening next
    if (currentRoundId > 0n) {
        const fresh = await withRetry("getRound(open-guard)", () => publicClient.readContract({ address: marketAddress, abi: ROUND_MARKET_ABI, functionName: "getRound", args: [currentRoundId] }));
        if (!fresh.resolved && !fresh.canceled) {
            log("⚠️", `openRound guard: round #${currentRoundId} not yet resolved. Skipping.`);
            throw new Error("openRound: current round not resolved");
        }
    }
    log("🆕", `Opening new round (${label})…`);
    const hash = await walletClient.writeContract({
        address: marketAddress,
        abi: ROUND_MARKET_ABI,
        functionName: "openRound",
        gas: GAS_LIMIT,
        chain: arcTestnet,
        account: account,
    });
    log("📤", `openRound tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
    log("✅", `New round opened! Gas: ${receipt.gasUsed} Block: ${receipt.blockNumber}`);
    (0, state_1.recordTxSuccess)();
    (0, logger_1.logEvent)("MARKET_CREATED", `New round opened (${label})`, "healthy");
}
// ─── Main Loop ────────────────────────────────────────────────────────────────
let isRunning = true;
async function main() {
    log("🚀", "DotMarket Keeper starting (block-authoritative engine)…");
    const config = loadConfig();
    const account = (0, accounts_1.privateKeyToAccount)(config.privateKey);
    log("⚙️", `RPC:     ${config.rpc}`);
    log("⚙️", `Market:  ${config.marketAddress}`);
    log("🔑", `Keeper:  ${account.address}`);
    state_1.guardianState.rpcEndpoint = config.rpc;
    // ── Viem Clients ──
    const transport = (0, viem_1.http)(config.rpc, { timeout: 20000, retryCount: 2, retryDelay: 2000 });
    const publicClient = (0, viem_1.createPublicClient)({ chain: arcTestnet, transport });
    const walletClient = (0, viem_1.createWalletClient)({ account, chain: arcTestnet, transport });
    // ── Startup: read balance ──
    const balance = await withRetry("getBalance", () => publicClient.getBalance({ address: account.address }));
    log("💎", `Balance: ${(0, viem_1.formatEther)(balance)} ETH`);
    state_1.guardianState.keeperBalance = (0, viem_1.formatEther)(balance);
    if (parseFloat((0, viem_1.formatEther)(balance)) < LOW_BALANCE_THRESHOLD) {
        log("🚨", `WARNING: Balance below ${LOW_BALANCE_THRESHOLD} ETH!`);
    }
    // ── Startup: read contract params ──
    const [pair, roundDuration, lockBuffer] = await Promise.all([
        withRetry("pair", () => publicClient.readContract({ address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "pair" })),
        withRetry("roundDuration", () => publicClient.readContract({ address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "roundDuration" })),
        withRetry("lockBuffer", () => publicClient.readContract({ address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "lockBuffer" })),
    ]);
    log("💱", `Pair: ${pair} | Duration: ${roundDuration}s | LockBuffer: ${lockBuffer}s`);
    state_1.guardianState.pair = pair;
    (0, logger_1.logEvent)("SYSTEM", `Keeper initialized — ${pair} ${roundDuration}s rounds`, "healthy");
    // ── Startup: crash recovery ──
    const persisted = loadPersistedState();
    if (persisted) {
        log("🔄", `Crash recovery: last known round=${persisted.lastKnownRoundId}, phase=${persisted.lastKnownPhase}`);
        // We do NOT restore in-memory state from this — we read fresh from chain below.
        // The persisted state is purely for logging/diagnostics.
    }
    // ─────────────────────────────────────────────────────────────────────────
    // MAIN LOOP
    //
    // Each iteration:
    //   1. Read latest block (authoritative timestamp)
    //   2. Read current round atomically alongside roundId
    //   3. Derive phase from block.timestamp + on-chain data
    //   4. Execute exactly one required transition (with idempotency guard)
    //   5. Sleep until near the next event OR wait for next block after a tx
    //
    // NEVER uses Date.now() to decide when to fire transactions.
    // ─────────────────────────────────────────────────────────────────────────
    while (isRunning) {
        if (state_1.guardianState.keeperCrashed) {
            await sleep(5000);
            continue;
        }
        (0, state_1.heartbeat)();
        try {
            // ── Step 1: Get latest block (authoritative timestamp) ──────────────
            const block = await withRetry("getBlock", () => publicClient.getBlock({ blockTag: "latest" }));
            const blockTs = block.timestamp; // BigInt, seconds
            const blockNum = block.number;
            // ── Step 2: Read roundId + round data in one atomic read ────────────
            const currentRoundId = await withRetry("currentRoundId", () => publicClient.readContract({ address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "currentRoundId" }));
            log("📊", `Block #${blockNum} ts=${blockTs} | Round #${currentRoundId}`);
            let round = null;
            if (currentRoundId > 0n) {
                round = await withRetry(`getRound(${currentRoundId})`, () => publicClient.readContract({ address: config.marketAddress, abi: ROUND_MARKET_ABI, functionName: "getRound", args: [currentRoundId] }));
            }
            // ── Step 3: Derive phase (blockchain-only, never Date.now) ──────────
            const phase = derivePhase(blockTs, currentRoundId, round ?? {
                roundId: 0n, startPrice: 0n, closePrice: 0n, totalUpAmount: 0n, totalDownAmount: 0n,
                startTimestamp: 0n, lockTimestamp: 0n, endTimestamp: 0n,
                rewardBaseCalAmount: 0n, rewardAmount: 0n, resolved: false, canceled: false,
            });
            const action = phaseToAction(phase);
            log("📋", `Phase: ${phase} | Action: ${action} | startPrice=${round?.startPrice ?? 0n}`);
            // ── Guardian state update ────────────────────────────────────────────
            if (round) {
                (0, state_1.updateRoundState)({
                    roundId: Number(round.roundId),
                    startPrice: round.startPrice,
                    lockTimestamp: Number(round.lockTimestamp),
                    endTimestamp: Number(round.endTimestamp),
                    startTimestamp: Number(round.startTimestamp),
                    resolved: round.resolved,
                    canceled: round.canceled,
                });
            }
            // ── Phase snapshot for /api/market-phase ────────────────────────────
            if (round) {
                const secsLeft = secsToNextEvent(blockTs, round);
                (0, state_1.updatePhaseSnapshot)({
                    roundId: Number(currentRoundId),
                    phase: phase === 'LOCKABLE' || phase === 'RESOLVABLE' ? 'SETTLING' : phase,
                    secondsRemaining: Number(secsLeft),
                    lockTimestamp: Number(round.lockTimestamp),
                    endTimestamp: Number(round.endTimestamp),
                    blockTimestamp: Number(blockTs),
                    startPrice: round.startPrice.toString(),
                    upPool: (0, viem_1.formatEther)(round.totalUpAmount),
                    downPool: (0, viem_1.formatEther)(round.totalDownAmount),
                });
            }
            saveState(currentRoundId, phase);
            // ── Step 4: Execute the required action ─────────────────────────────
            switch (action) {
                case "OPEN_GENESIS": {
                    log("🆕", "Genesis: opening first round…");
                    await withRetry("openRound(genesis)", () => doOpenRound(publicClient, walletClient, account, config.marketAddress, 0n, "genesis"));
                    await waitForNextBlock(publicClient, blockNum);
                    break;
                }
                case "LOCK_ROUND": {
                    await withRetry(`lockRound(${currentRoundId})`, () => doLockRound(publicClient, walletClient, account, config.marketAddress, currentRoundId, pair));
                    await waitForNextBlock(publicClient, blockNum);
                    break;
                }
                case "RESOLVE_AND_OPEN": {
                    // Resolve current round
                    await withRetry(`resolveRound(${currentRoundId})`, () => doResolveRound(publicClient, walletClient, account, config.marketAddress, currentRoundId, pair));
                    // Wait for confirmation block
                    await waitForNextBlock(publicClient, blockNum);
                    // Small delay for indexers
                    await sleep(RESOLVE_TO_OPEN_DELAY_MS);
                    // Open next round
                    await withRetry("openRound(after-resolve)", () => doOpenRound(publicClient, walletClient, account, config.marketAddress, currentRoundId, "after-resolve"));
                    const postBlock = await withRetry("getBlock(post-open)", () => publicClient.getBlock({ blockTag: "latest" }));
                    await waitForNextBlock(publicClient, postBlock.number);
                    break;
                }
                case "OPEN_AFTER_RESOLVE": {
                    // Current round resolved but next wasn't opened (restart scenario)
                    log("🔄", `Round #${currentRoundId} already resolved. Opening next round…`);
                    await withRetry("openRound(restart-recovery)", () => doOpenRound(publicClient, walletClient, account, config.marketAddress, currentRoundId, "restart-recovery"));
                    await waitForNextBlock(publicClient, blockNum);
                    break;
                }
                case "WAIT": {
                    // No action needed — sleep until near the next event
                    const secsLeft = round ? secsToNextEvent(blockTs, round) : 10n;
                    const nextEventLabel = round?.startPrice === 0n ? "LOCK" : "RESOLVE";
                    await waitUntilEvent(publicClient, config.marketAddress, round?.startPrice === 0n
                        ? (round?.lockTimestamp ?? 0n) + LOCK_GRACE_SECS
                        : (round?.endTimestamp ?? 0n) + END_GRACE_SECS, nextEventLabel);
                    break;
                }
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log("❌", `Loop error: ${msg}`);
            if (err instanceof Error && err.stack)
                console.error(err.stack);
            (0, state_1.recordError)(msg);
            (0, logger_1.logEvent)("KEEPER_ERROR", `Loop error: ${msg}`, "critical");
            log("⏳", `Cooling down ${ERROR_COOLDOWN_MS / 1000}s…`);
            await sleep(ERROR_COOLDOWN_MS);
        }
    }
    log("👋", "Keeper shut down.");
}
// ─── HTTP Server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 10000;
const server = http_1.default.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    // ── /api/market-phase — authoritative phase for the frontend ──
    if (req.url === "/api/market-phase" && req.method === "GET") {
        const snap = state_1.guardianState.phaseSnapshot;
        if (snap) {
            res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
            res.end(JSON.stringify(snap));
        }
        else {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "phase not yet computed" }));
        }
        return;
    }
    // Guardian API routes
    if (req.url?.startsWith("/guardian/")) {
        await (0, routes_1.handleGuardianRequest)(req, res);
        return;
    }
    // Health check
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        status: "healthy",
        uptime: Math.floor((Date.now() - state_1.guardianState.keeperStartTime) / 1000),
        round: state_1.guardianState.currentRoundId,
        phase: state_1.guardianState.marketPhase,
        balance: state_1.guardianState.keeperBalance,
    }));
});
server.listen(PORT, "0.0.0.0", () => {
    log("🌐", `HTTP server on :${PORT}`);
    (0, monitor_1.startGuardianMonitor)();
    (0, logger_1.logEvent)("SYSTEM", "Protocol Guardian activated", "healthy");
});
// ─── Graceful Shutdown ───────────────────────────────────────────────────────
function shutdown(signal) {
    log("🛑", `${signal} received — shutting down…`);
    isRunning = false;
    server.close(() => log("🌐", "HTTP server closed."));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// ─── Entrypoint ──────────────────────────────────────────────────────────────
main().catch((err) => {
    log("💀", `Fatal: ${err instanceof Error ? err.message : String(err)}`);
    if (err instanceof Error && err.stack)
        console.error(err.stack);
    process.exit(1);
});
//# sourceMappingURL=index.js.map