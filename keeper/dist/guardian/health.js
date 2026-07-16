"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectHealthSnapshot = collectHealthSnapshot;
const viem_1 = require("viem");
const state_1 = require("./state");
// ── Health Monitor ──────────────────────────────────────────────────────────
// Collects a complete health snapshot every monitoring cycle.
/** Measure RPC latency via a timed getBlockNumber() call */
async function measureRpcLatency() {
    if (state_1.guardianState.simulateRpcSlow)
        return 2500; // Simulated slow RPC
    const rpc = state_1.guardianState.rpcEndpoint;
    if (!rpc)
        return -1;
    const client = (0, viem_1.createPublicClient)({
        transport: (0, viem_1.http)(rpc, { timeout: 5000, retryCount: 0 }),
    });
    const start = Date.now();
    try {
        await client.getBlockNumber();
        return Date.now() - start;
    }
    catch {
        return 9999; // Unreachable
    }
}
/** Check Pyth oracle freshness by fetching latest price timestamp */
async function checkOracleFreshness() {
    if (state_1.guardianState.simulateOracleStale) {
        return { fresh: false, ageMs: 30000 }; // Simulated stale
    }
    const feedId = 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
    try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok)
            return { fresh: false, ageMs: -1 };
        const data = await res.json();
        const publishTime = data.parsed?.[0]?.price?.publish_time;
        if (!publishTime)
            return { fresh: false, ageMs: -1 };
        const ageMs = Date.now() - publishTime * 1000;
        return { fresh: ageMs < 10000, ageMs };
    }
    catch {
        return { fresh: false, ageMs: -1 };
    }
}
/** Get process memory and CPU usage */
function getSystemMetrics() {
    const mem = process.memoryUsage();
    // Approximate: used heap vs total available (256MB on Fly.io)
    const totalMB = 256;
    const usedMB = mem.heapUsed / (1024 * 1024);
    const memoryPercent = Math.round((usedMB / totalMB) * 100);
    // CPU approximation using process.cpuUsage()
    const cpu = process.cpuUsage();
    const totalCpuMs = (cpu.user + cpu.system) / 1000;
    const uptimeMs = process.uptime() * 1000;
    const cpuPercent = Math.min(100, Math.round((totalCpuMs / uptimeMs) * 100));
    return { memoryPercent, cpuPercent };
}
/** Format "time ago" string */
function timeAgo(timestampMs) {
    if (timestampMs === 0)
        return 'never';
    const seconds = Math.floor((Date.now() - timestampMs) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}
/** Determine overall health severity from component states */
function computeOverallHealth(keeperAlive, rpcLatency, oracleFresh, timer, phase) {
    // Critical conditions
    if (!keeperAlive)
        return 'critical';
    if (rpcLatency > 1500 || rpcLatency === 9999)
        return 'critical';
    if (phase === 'SETTLING' && timer < -90)
        return 'critical';
    // Degraded conditions
    if (rpcLatency > 800)
        return 'degraded';
    if (!oracleFresh)
        return 'degraded';
    if (phase === 'SETTLING' && timer < -30)
        return 'degraded';
    // Warning conditions
    if (rpcLatency > 500)
        return 'warning';
    if (timer < 0 && timer > -30)
        return 'warning';
    return 'healthy';
}
/** Collect a complete health snapshot */
async function collectHealthSnapshot() {
    const now = Math.floor(Date.now() / 1000);
    // Keeper heartbeat check — if no heartbeat for 30s, consider offline
    const heartbeatAge = Date.now() - state_1.guardianState.lastHeartbeat;
    const keeperAlive = state_1.guardianState.keeperAlive && !state_1.guardianState.keeperCrashed && heartbeatAge < 30000;
    // Calculate timer remaining
    let timer = 0;
    const phase = state_1.guardianState.marketPhase;
    if (phase === 'OPEN') {
        timer = state_1.guardianState.roundLockTimestamp - now;
    }
    else if (phase === 'LOCKED' || phase === 'SETTLING') {
        timer = state_1.guardianState.roundEndTimestamp - now;
    }
    // Collect async metrics
    const [rpcLatency, oracle] = await Promise.all([
        measureRpcLatency(),
        checkOracleFreshness(),
    ]);
    const { memoryPercent, cpuPercent } = getSystemMetrics();
    const snapshot = {
        timestamp: Date.now(),
        marketId: state_1.guardianState.currentRoundId,
        phase,
        timer,
        keeperAlive,
        keeperUptime: Math.floor((Date.now() - state_1.guardianState.keeperStartTime) / 1000),
        oracleFresh: oracle.fresh,
        oracleLastUpdate: oracle.ageMs,
        rpcLatency,
        rpcEndpoint: state_1.guardianState.rpcEndpoint,
        pendingTx: state_1.guardianState.pendingTxCount,
        failedTx: state_1.guardianState.failedTxCount,
        lastSettlement: timeAgo(state_1.guardianState.lastSettlementTime),
        memoryUsage: memoryPercent,
        cpuUsage: cpuPercent,
        keeperBalance: state_1.guardianState.keeperBalance,
        overallHealth: computeOverallHealth(keeperAlive, rpcLatency, oracle.fresh, timer, phase),
    };
    // Store in shared state for API access
    state_1.guardianState.latestSnapshot = snapshot;
    return snapshot;
}
//# sourceMappingURL=health.js.map