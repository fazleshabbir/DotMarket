"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGuardianMonitor = startGuardianMonitor;
exports.stopGuardianMonitor = stopGuardianMonitor;
exports.triggerManualAnalysis = triggerManualAnalysis;
const health_1 = require("./health");
const rules_1 = require("./rules");
const analyzer_1 = require("./analyzer");
const recovery_1 = require("./recovery");
const state_1 = require("./state");
const logger_1 = require("./logger");
// ── Guardian Monitor ────────────────────────────────────────────────────────
// Orchestrates health → rules → AI → recovery on a regular interval.
const MONITOR_INTERVAL_MS = 5000; // Check every 5 seconds
const AUTO_RECOVER = true; // Enable automatic recovery
let monitorInterval = null;
let isRunning = false;
/** Single monitoring cycle */
async function monitorCycle() {
    if (isRunning)
        return; // Prevent overlapping cycles
    isRunning = true;
    try {
        // Phase 1: Collect health snapshot
        const snapshot = await (0, health_1.collectHealthSnapshot)();
        // Phase 2: Evaluate deterministic rules
        const alerts = (0, rules_1.evaluateRules)(snapshot);
        state_1.guardianState.latestAlerts = alerts;
        // Log health check (only on state changes or every ~30s)
        const alertCount = alerts.length;
        if (alertCount > 0) {
            (0, logger_1.logEvent)('HEALTH_CHECK', `Health: ${snapshot.overallHealth} | ${alertCount} alert(s) | RPC: ${snapshot.rpcLatency}ms | Market: #${snapshot.marketId}`, snapshot.overallHealth);
        }
        // Phase 3: AI Analysis (only when non-healthy)
        if (snapshot.overallHealth !== 'healthy') {
            const analysis = await (0, analyzer_1.analyzeHealth)(snapshot, alerts);
            state_1.guardianState.latestAIAnalysis = analysis;
            // Phase 4 & 6: Automatic Recovery
            if (AUTO_RECOVER && analysis.recommendedActions.length > 0) {
                // Sort by priority and execute the highest priority action
                const sorted = [...analysis.recommendedActions].sort((a, b) => a.priority - b.priority);
                const topAction = sorted[0];
                (0, logger_1.logEvent)('AUTO_RECOVERY', `AI recommends: ${topAction.action} (priority ${topAction.priority}) — ${topAction.reasoning}`, 'warning');
                const result = await (0, recovery_1.executeRecovery)(topAction.action);
                if (result.success) {
                    (0, logger_1.logEvent)('RECOVERY_SUCCESS', `${topAction.action} completed in ${result.duration}ms`, 'healthy');
                }
            }
        }
        else {
            // Clear AI analysis when healthy
            if (state_1.guardianState.latestAIAnalysis) {
                state_1.guardianState.latestAIAnalysis = null;
            }
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        (0, logger_1.logEvent)('MONITOR_ERROR', `Guardian monitor error: ${msg}`, 'critical');
    }
    finally {
        isRunning = false;
    }
}
/** Start the guardian monitoring loop */
function startGuardianMonitor() {
    if (monitorInterval)
        return;
    (0, logger_1.logEvent)('SYSTEM', `Guardian monitor started — checking every ${MONITOR_INTERVAL_MS / 1000}s`, 'healthy');
    // Run first cycle immediately
    monitorCycle();
    // Then on interval
    monitorInterval = setInterval(monitorCycle, MONITOR_INTERVAL_MS);
}
/** Stop the guardian monitoring loop */
function stopGuardianMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        (0, logger_1.logEvent)('SYSTEM', 'Guardian monitor stopped', 'warning');
    }
}
/** Manually trigger a single monitoring cycle (for API) */
async function triggerManualAnalysis() {
    const snapshot = await (0, health_1.collectHealthSnapshot)();
    const alerts = (0, rules_1.evaluateRules)(snapshot);
    state_1.guardianState.latestAlerts = alerts;
    const analysis = await (0, analyzer_1.analyzeHealth)(snapshot, alerts);
    state_1.guardianState.latestAIAnalysis = analysis;
    return { snapshot, alerts, analysis };
}
//# sourceMappingURL=monitor.js.map