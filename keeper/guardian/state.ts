import type { HealthSnapshot, Alert, AIAnalysis, RecoveryResult, MarketPhase } from './types';

// ─── Phase Snapshot (served via /api/market-phase) ───────────────────────────
// Updated each keeper loop iteration from block.timestamp + round data.
// This is the authoritative phase data the frontend polls.

export interface PhaseSnapshot {
  roundId:          number;
  phase:            'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'GENESIS';
  secondsRemaining: number;
  lockTimestamp:    number;
  endTimestamp:     number;
  blockTimestamp:   number;
  startPrice:       string;
  upPool:           string;
  downPool:         string;
  updatedAt:        number;   // Unix ms — so the frontend can detect staleness
}

// ── Shared Guardian State ────────────────────────────────────────────────────
// Mutable singleton. The keeper main loop writes to this;
// guardian modules and HTTP routes read from it.

export const guardianState = {
  // Keeper process state
  keeperAlive:       true,
  keeperStartTime:   Date.now(),
  lastHeartbeat:     Date.now(),
  lastLoopIteration: Date.now(),

  // On-chain state (updated each loop from block.timestamp, NOT Date.now)
  currentRoundId:      0,
  marketPhase:         'UNKNOWN' as MarketPhase,
  roundStartTimestamp: 0,
  roundLockTimestamp:  0,
  roundEndTimestamp:   0,
  roundStartPrice:     0n,
  roundResolved:       false,
  roundCanceled:       false,

  // Transaction metrics
  pendingTxCount:      0,
  failedTxCount:       0,
  totalTxCount:        0,
  lastSettlementTime:  0,

  // RPC state
  currentRpcIndex: 0,
  rpcEndpoint:     '',

  // Config
  pair: '',

  // Guardian control flags
  isPaused:             false,
  keeperCrashed:        false,   // Simulated crash flag
  simulateRpcSlow:      false,   // Simulated slow RPC flag
  simulateOracleStale:  false,   // Simulated stale oracle flag

  // Error tracking
  lastError:         null as string | null,
  lastErrorTime:     0,
  consecutiveErrors: 0,

  // Latest snapshots (for API)
  latestSnapshot:     null as HealthSnapshot | null,
  latestAlerts:       [] as Alert[],
  latestAIAnalysis:   null as AIAnalysis | null,
  lastRecoveries:     [] as RecoveryResult[],

  // Keeper balance
  keeperBalance: '0',

  // Phase snapshot — served at /api/market-phase
  phaseSnapshot: null as PhaseSnapshot | null,
};

// ── State Mutation Helpers ───────────────────────────────────────────────────

export function heartbeat(): void {
  guardianState.lastHeartbeat     = Date.now();
  guardianState.keeperAlive       = true;
  guardianState.lastLoopIteration = Date.now();
}

/**
 * Update round state from on-chain data.
 * Phase derivation uses blockTimestamp (passed in) — NEVER Date.now().
 */
export function updateRoundState(round: {
  roundId:        number;
  startPrice:     bigint;
  lockTimestamp:  number;
  endTimestamp:   number;
  startTimestamp: number;
  resolved:       boolean;
  canceled:       boolean;
  blockTimestamp?: number;  // pass the actual block.timestamp for phase derivation
}): void {
  guardianState.currentRoundId      = round.roundId;
  guardianState.roundStartPrice     = round.startPrice;
  guardianState.roundLockTimestamp  = round.lockTimestamp;
  guardianState.roundEndTimestamp   = round.endTimestamp;
  guardianState.roundStartTimestamp = round.startTimestamp;
  guardianState.roundResolved       = round.resolved;
  guardianState.roundCanceled       = round.canceled;

  // Use blockTimestamp if provided, otherwise fall back to Date.now()
  // (guardian monitor may call this without a block timestamp)
  const ts = round.blockTimestamp ?? Math.floor(Date.now() / 1000);

  if (round.resolved) {
    guardianState.marketPhase = 'RESOLVED';
  } else if (round.canceled) {
    guardianState.marketPhase = 'CANCELED';
  } else if (round.startPrice > 0n && ts >= round.endTimestamp) {
    guardianState.marketPhase = 'SETTLING';
  } else if (round.startPrice > 0n) {
    guardianState.marketPhase = 'LOCKED';
  } else if (ts >= round.lockTimestamp) {
    guardianState.marketPhase = 'SETTLING';
  } else {
    guardianState.marketPhase = 'OPEN';
  }
}

/**
 * Update the phase snapshot that is served to the frontend via /api/market-phase.
 * Called each keeper loop after deriving phase from block.timestamp.
 */
export function updatePhaseSnapshot(snap: Omit<PhaseSnapshot, 'updatedAt'>): void {
  guardianState.phaseSnapshot = { ...snap, updatedAt: Date.now() };
}

export function recordError(error: string): void {
  guardianState.lastError        = error;
  guardianState.lastErrorTime    = Date.now();
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
