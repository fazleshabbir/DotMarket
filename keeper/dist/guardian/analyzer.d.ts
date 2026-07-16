import type { HealthSnapshot, Alert, AIAnalysis } from './types';
/** Main analysis entry point — tries AI first, falls back to deterministic */
export declare function analyzeHealth(snapshot: HealthSnapshot, alerts: Alert[]): Promise<AIAnalysis>;
//# sourceMappingURL=analyzer.d.ts.map