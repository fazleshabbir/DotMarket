export type MarketPhase = 'IDLE' | 'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'CANCELED' | 'UNKNOWN';
export type Severity = 'healthy' | 'warning' | 'degraded' | 'critical';
export type RecoveryAction = 'RESTART_KEEPER' | 'SWITCH_RPC' | 'RETRY_SETTLEMENT' | 'PAUSE_MARKETS' | 'RESUME_MARKETS' | 'CLEAR_QUEUE' | 'NOTIFY_ADMIN';
export interface HealthSnapshot {
    timestamp: number;
    marketId: number;
    phase: MarketPhase;
    timer: number;
    keeperAlive: boolean;
    keeperUptime: number;
    oracleFresh: boolean;
    oracleLastUpdate: number;
    rpcLatency: number;
    rpcEndpoint: string;
    pendingTx: number;
    failedTx: number;
    lastSettlement: string;
    memoryUsage: number;
    cpuUsage: number;
    keeperBalance: string;
    overallHealth: Severity;
}
export interface Alert {
    id: string;
    rule: string;
    severity: Severity;
    message: string;
    timestamp: number;
    resolved: boolean;
}
export interface AIAnalysis {
    overallHealth: Severity;
    rootCause: string;
    confidence: number;
    recommendedActions: {
        action: RecoveryAction;
        priority: number;
        reasoning: string;
    }[];
    summary: string;
    timestamp: number;
}
export interface LogEvent {
    id: string;
    type: string;
    message: string;
    severity: Severity;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface RecoveryResult {
    success: boolean;
    action: RecoveryAction;
    message: string;
    duration: number;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map