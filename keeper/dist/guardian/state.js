"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardianState = void 0;
exports.heartbeat = heartbeat;
exports.updateRoundState = updateRoundState;
exports.updatePhaseSnapshot = updatePhaseSnapshot;
exports.recordError = recordError;
exports.recordTxSuccess = recordTxSuccess;
exports.recordTxFailure = recordTxFailure;
exports.recordSettlement = recordSettlement;
// ── Shared Guardian State ────────────────────────────────────────────────────
// Mutable singleton. The keeper main loop writes to this;
// guardian modules and HTTP routes read from it.
exports.guardianState = {
    // Keeper process state
    keeperAlive: true,
    keeperStartTime: Date.now(),
    lastHeartbeat: Date.now(),
    lastLoopIteration: Date.now(),
    // On-chain state (updated each loop from block.timestamp, NOT Date.now)
    currentRoundId: 0,
    marketPhase: 'UNKNOWN',
    roundStartTimestamp: 0,
    roundLockTimestamp: 0,
    roundEndTimestamp: 0,
    roundStartPrice: 0n,
    roundResolved: false,
    roundCanceled: false,
    // Transaction metrics
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
    keeperCrashed: false, // Simulated crash flag
    simulateRpcSlow: false, // Simulated slow RPC flag
    simulateOracleStale: false, // Simulated stale oracle flag
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
    // Phase snapshot — served at /api/market-phase
    phaseSnapshot: null,
};
// ── State Mutation Helpers ───────────────────────────────────────────────────
function heartbeat() {
    exports.guardianState.lastHeartbeat = Date.now();
    exports.guardianState.keeperAlive = true;
    exports.guardianState.lastLoopIteration = Date.now();
}
/**
 * Update round state from on-chain data.
 * Phase derivation uses blockTimestamp (passed in) — NEVER Date.now().
 */
function updateRoundState(round) {
    exports.guardianState.currentRoundId = round.roundId;
    exports.guardianState.roundStartPrice = round.startPrice;
    exports.guardianState.roundLockTimestamp = round.lockTimestamp;
    exports.guardianState.roundEndTimestamp = round.endTimestamp;
    exports.guardianState.roundStartTimestamp = round.startTimestamp;
    exports.guardianState.roundResolved = round.resolved;
    exports.guardianState.roundCanceled = round.canceled;
    // Use blockTimestamp if provided, otherwise fall back to Date.now()
    // (guardian monitor may call this without a block timestamp)
    const ts = round.blockTimestamp ?? Math.floor(Date.now() / 1000);
    if (round.resolved) {
        exports.guardianState.marketPhase = 'RESOLVED';
    }
    else if (round.canceled) {
        exports.guardianState.marketPhase = 'CANCELED';
    }
    else if (round.startPrice > 0n && ts >= round.endTimestamp) {
        exports.guardianState.marketPhase = 'SETTLING';
    }
    else if (round.startPrice > 0n) {
        exports.guardianState.marketPhase = 'LOCKED';
    }
    else if (ts >= round.lockTimestamp) {
        exports.guardianState.marketPhase = 'SETTLING';
    }
    else {
        exports.guardianState.marketPhase = 'OPEN';
    }
}
/**
 * Update the phase snapshot that is served to the frontend via /api/market-phase.
 * Called each keeper loop after deriving phase from block.timestamp.
 */
function updatePhaseSnapshot(snap) {
    exports.guardianState.phaseSnapshot = { ...snap, updatedAt: Date.now() };
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