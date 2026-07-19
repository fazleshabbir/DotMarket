import type { HealthSnapshot, Alert, AIAnalysis, RecoveryResult, MarketPhase } from './types';
export interface PhaseSnapshot {
    roundId: number;
    phase: 'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'GENESIS';
    secondsRemaining: number;
    lockTimestamp: number;
    endTimestamp: number;
    blockTimestamp: number;
    startPrice: string;
    upPool: string;
    downPool: string;
    updatedAt: number;
}
export declare const guardianState: {
    keeperAlive: boolean;
    keeperStartTime: number;
    lastHeartbeat: number;
    lastLoopIteration: number;
    currentRoundId: number;
    marketPhase: MarketPhase;
    roundStartTimestamp: number;
    roundLockTimestamp: number;
    roundEndTimestamp: number;
    roundStartPrice: bigint;
    roundResolved: boolean;
    roundCanceled: boolean;
    pendingTxCount: number;
    failedTxCount: number;
    totalTxCount: number;
    lastSettlementTime: number;
    currentRpcIndex: number;
    rpcEndpoint: string;
    pair: string;
    isPaused: boolean;
    keeperCrashed: boolean;
    simulateRpcSlow: boolean;
    simulateOracleStale: boolean;
    lastError: string | null;
    lastErrorTime: number;
    consecutiveErrors: number;
    latestSnapshot: HealthSnapshot | null;
    latestAlerts: Alert[];
    latestAIAnalysis: AIAnalysis | null;
    lastRecoveries: RecoveryResult[];
    keeperBalance: string;
    phaseSnapshot: PhaseSnapshot | null;
};
export declare function heartbeat(): void;
/**
 * Update round state from on-chain data.
 * Phase derivation uses blockTimestamp (passed in) — NEVER Date.now().
 */
export declare function updateRoundState(round: {
    roundId: number;
    startPrice: bigint;
    lockTimestamp: number;
    endTimestamp: number;
    startTimestamp: number;
    resolved: boolean;
    canceled: boolean;
    blockTimestamp?: number;
}): void;
/**
 * Update the phase snapshot that is served to the frontend via /api/market-phase.
 * Called each keeper loop after deriving phase from block.timestamp.
 */
export declare function updatePhaseSnapshot(snap: Omit<PhaseSnapshot, 'updatedAt'>): void;
export declare function recordError(error: string): void;
export declare function recordTxSuccess(): void;
export declare function recordTxFailure(): void;
export declare function recordSettlement(): void;
//# sourceMappingURL=state.d.ts.map