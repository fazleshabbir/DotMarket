"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardianState = void 0;
exports.heartbeat = heartbeat;
exports.updateRoundState = updateRoundState;
exports.recordError = recordError;
exports.recordTxSuccess = recordTxSuccess;
exports.recordTxFailure = recordTxFailure;
exports.recordSettlement = recordSettlement;
// ── Shared Guardian State ───────────────────────────────────────────────────
// Mutable singleton. The keeper main loop writes to this,
// the guardian modules read from it.
exports.guardianState = {
    // Keeper process state
    keeperAlive: true,
    keeperStartTime: Date.now(),
    lastHeartbeat: Date.now(),
    lastLoopIteration: Date.now(),
    // On-chain state
    currentRoundId: 0,
    marketPhase: 'UNKNOWN',
    roundStartTimestamp: 0,
    roundLockTimestamp: 0,
    roundEndTimestamp: 0,
    roundStartPrice: 0n,
    roundResolved: false,
    roundCanceled: false,
    // Transaction state
    pendingTxCount: 0,
    failedTxCount: 0,
    totalTxCount: 0,
    lastSettlementTime: 0,
    // RPC state
    currentRpcIndex: 0,
    rpcEndpoint: '',
    // Config
    pair: '',
    // Guardian control flags
    isPaused: false,
    keeperCrashed: false, // Simulated crash for demo
    simulateRpcSlow: false, // Simulated slow RPC for demo
    simulateOracleStale: false, // Simulated stale oracle for demo
    // Error tracking
    lastError: null,
    lastErrorTime: 0,
    consecutiveErrors: 0,
    // Latest snapshots (for API)
    latestSnapshot: null,
    latestAlerts: [],
    latestAIAnalysis: null,
    lastRecoveries: [],
    // Keeper balance
    keeperBalance: '0',
};
// ── State Mutation Helpers ──────────────────────────────────────────────────
function heartbeat() {
    exports.guardianState.lastHeartbeat = Date.now();
    exports.guardianState.keeperAlive = true;
    exports.guardianState.lastLoopIteration = Date.now();
}
function updateRoundState(round) {
    exports.guardianState.currentRoundId = round.roundId;
    exports.guardianState.roundStartPrice = round.startPrice;
    exports.guardianState.roundLockTimestamp = round.lockTimestamp;
    exports.guardianState.roundEndTimestamp = round.endTimestamp;
    exports.guardianState.roundStartTimestamp = round.startTimestamp;
    exports.guardianState.roundResolved = round.resolved;
    exports.guardianState.roundCanceled = round.canceled;
    // Derive phase from on-chain state
    const now = Math.floor(Date.now() / 1000);
    if (round.resolved) {
        exports.guardianState.marketPhase = 'RESOLVED';
    }
    else if (round.canceled) {
        exports.guardianState.marketPhase = 'CANCELED';
    }
    else if (round.startPrice > 0n && now >= round.endTimestamp) {
        exports.guardianState.marketPhase = 'SETTLING';
    }
    else if (round.startPrice > 0n) {
        exports.guardianState.marketPhase = 'LOCKED';
    }
    else if (now >= round.lockTimestamp) {
        exports.guardianState.marketPhase = 'SETTLING';
    }
    else {
        exports.guardianState.marketPhase = 'OPEN';
    }
}
function recordError(error) {
    exports.guardianState.lastError = error;
    exports.guardianState.lastErrorTime = Date.now();
    exports.guardianState.consecutiveErrors++;
}
function recordTxSuccess() {
    exports.guardianState.totalTxCount++;
    exports.guardianState.consecutiveErrors = 0;
}
function recordTxFailure() {
    exports.guardianState.failedTxCount++;
    exports.guardianState.totalTxCount++;
}
function recordSettlement() {
    exports.guardianState.lastSettlementTime = Date.now();
}
//# sourceMappingURL=state.js.map