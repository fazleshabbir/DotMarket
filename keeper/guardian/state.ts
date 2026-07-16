import type { HealthSnapshot, Alert, AIAnalysis, RecoveryResult, MarketPhase } from './types';

// ── Shared Guardian State ───────────────────────────────────────────────────
// Mutable singleton. The keeper main loop writes to this,
// the guardian modules read from it.

export const guardianState = {
  // Keeper process state
  keeperAlive: true,
  keeperStartTime: Date.now(),
  lastHeartbeat: Date.now(),
  lastLoopIteration: Date.now(),

  // On-chain state
  currentRoundId: 0,
  marketPhase: 'UNKNOWN' as MarketPhase,
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
  keeperCrashed: false,   // Simulated crash for demo
  simulateRpcSlow: false, // Simulated slow RPC for demo
  simulateOracleStale: false, // Simulated stale oracle for demo

  // Error tracking
  lastError: null as string | null,
  lastErrorTime: 0,
  consecutiveErrors: 0,

  // Latest snapshots (for API)
  latestSnapshot: null as HealthSnapshot | null,
  latestAlerts: [] as Alert[],
  latestAIAnalysis: null as AIAnalysis | null,
  lastRecoveries: [] as RecoveryResult[],

  // Keeper balance
  keeperBalance: '0',
};

// ── State Mutation Helpers ──────────────────────────────────────────────────

export function heartbeat(): void {
  guardianState.lastHeartbeat = Date.now();
  guardianState.keeperAlive = true;
  guardianState.lastLoopIteration = Date.now();
}

export function updateRoundState(round: {
  roundId: number;
  startPrice: bigint;
  lockTimestamp: number;
  endTimestamp: number;
  startTimestamp: number;
  resolved: boolean;
  canceled: boolean;
}): void {
  guardianState.currentRoundId = round.roundId;
  guardianState.roundStartPrice = round.startPrice;
  guardianState.roundLockTimestamp = round.lockTimestamp;
  guardianState.roundEndTimestamp = round.endTimestamp;
  guardianState.roundStartTimestamp = round.startTimestamp;
  guardianState.roundResolved = round.resolved;
  guardianState.roundCanceled = round.canceled;

  // Derive phase from on-chain state
  const now = Math.floor(Date.now() / 1000);
  if (round.resolved) {
    guardianState.marketPhase = 'RESOLVED';
  } else if (round.canceled) {
    guardianState.marketPhase = 'CANCELED';
  } else if (round.startPrice > 0n && now >= round.endTimestamp) {
    guardianState.marketPhase = 'SETTLING';
  } else if (round.startPrice > 0n) {
    guardianState.marketPhase = 'LOCKED';
  } else if (now >= round.lockTimestamp) {
    guardianState.marketPhase = 'SETTLING';
  } else {
    guardianState.marketPhase = 'OPEN';
  }
}

export function recordError(error: string): void {
  guardianState.lastError = error;
  guardianState.lastErrorTime = Date.now();
  guardianState.consecutiveErrors++;
}

export function recordTxSuccess(): void {
  guardianState.totalTxCount++;
  guardianState.consecutiveErrors = 0;
}

export function recordTxFailure(): void {
  guardianState.failedTxCount++;
  guardianState.totalTxCount++;
}

export function recordSettlement(): void {
  guardianState.lastSettlementTime = Date.now();
}
