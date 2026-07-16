import type { HealthSnapshot, Alert, Severity } from './types';
/** Evaluate all rules against a health snapshot */
export declare function evaluateRules(snapshot: HealthSnapshot): Alert[];
/** Get the worst severity from a set of alerts */
export declare function worstSeverity(alerts: Alert[]): Severity;
//# sourceMappingURL=rules.d.ts.map