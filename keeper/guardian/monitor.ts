import { collectHealthSnapshot } from './health';
import { evaluateRules, worstSeverity } from './rules';
import { analyzeHealth } from './analyzer';
import { executeRecovery } from './recovery';
import { guardianState } from './state';
import { logEvent } from './logger';

// ── Guardian Monitor ────────────────────────────────────────────────────────
// Orchestrates health → rules → AI → recovery on a regular interval.

const MONITOR_INTERVAL_MS = 5_000;  // Check every 5 seconds
const AUTO_RECOVER = true;          // Enable automatic recovery

let monitorInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/** Single monitoring cycle */
async function monitorCycle(): Promise<void> {
  if (isRunning) return; // Prevent overlapping cycles
  isRunning = true;

  try {
    // Phase 1: Collect health snapshot
    const snapshot = await collectHealthSnapshot();

    // Phase 2: Evaluate deterministic rules
    const alerts = evaluateRules(snapshot);
    guardianState.latestAlerts = alerts;

    // Log health check (only on state changes or every ~30s)
    const alertCount = alerts.length;
    if (alertCount > 0) {
      logEvent('HEALTH_CHECK', `Health: ${snapshot.overallHealth} | ${alertCount} alert(s) | RPC: ${snapshot.rpcLatency}ms | Market: #${snapshot.marketId}`, snapshot.overallHealth);
    }

    // Phase 3: AI Analysis (only when non-healthy)
    if (snapshot.overallHealth !== 'healthy') {
      const analysis = await analyzeHealth(snapshot, alerts);
      guardianState.latestAIAnalysis = analysis;

      // Phase 4 & 6: Automatic Recovery
      if (AUTO_RECOVER && analysis.recommendedActions.length > 0) {
        // Sort by priority and execute the highest priority action
        const sorted = [...analysis.recommendedActions].sort((a, b) => a.priority - b.priority);
        const topAction = sorted[0];

        logEvent(
          'AUTO_RECOVERY',
          `AI recommends: ${topAction.action} (priority ${topAction.priority}) — ${topAction.reasoning}`,
          'warning'
        );

        const result = await executeRecovery(topAction.action);
        if (result.success) {
          logEvent('RECOVERY_SUCCESS', `${topAction.action} completed in ${result.duration}ms`, 'healthy');
        }
      }
    } else {
      // Clear AI analysis when healthy
      if (guardianState.latestAIAnalysis) {
        guardianState.latestAIAnalysis = null;
      }
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent('MONITOR_ERROR', `Guardian monitor error: ${msg}`, 'critical');
  } finally {
    isRunning = false;
  }
}

/** Start the guardian monitoring loop */
export function startGuardianMonitor(): void {
  if (monitorInterval) return;

  logEvent('SYSTEM', `Guardian monitor started — checking every ${MONITOR_INTERVAL_MS / 1000}s`, 'healthy');

  // Run first cycle immediately
  monitorCycle();

  // Then on interval
  monitorInterval = setInterval(monitorCycle, MONITOR_INTERVAL_MS);
}

/** Stop the guardian monitoring loop */
export function stopGuardianMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    logEvent('SYSTEM', 'Guardian monitor stopped', 'warning');
  }
}

/** Manually trigger a single monitoring cycle (for API) */
export async function triggerManualAnalysis() {
  const snapshot = await collectHealthSnapshot();
  const alerts = evaluateRules(snapshot);
  guardianState.latestAlerts = alerts;
  const analysis = await analyzeHealth(snapshot, alerts);
  guardianState.latestAIAnalysis = analysis;
  return { snapshot, alerts, analysis };
}
