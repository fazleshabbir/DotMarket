/** Start the guardian monitoring loop */
export declare function startGuardianMonitor(): void;
/** Stop the guardian monitoring loop */
export declare function stopGuardianMonitor(): void;
/** Manually trigger a single monitoring cycle (for API) */
export declare function triggerManualAnalysis(): Promise<{
    snapshot: import("./types").HealthSnapshot;
    alerts: import("./types").Alert[];
    analysis: import("./types").AIAnalysis;
}>;
//# sourceMappingURL=monitor.d.ts.map