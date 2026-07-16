import type { IncomingMessage, ServerResponse } from 'http';
import type { RecoveryAction } from './types';
import { guardianState } from './state';
import { getEvents } from './logger';
import { logEvent } from './logger';
import { executeRecovery } from './recovery';
import { triggerManualAnalysis } from './monitor';

// ── Guardian HTTP Route Handler ─────────────────────────────────────────────
// Handles all /guardian/* routes on the keeper's existing HTTP server.

/** Parse JSON body from incoming request */
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/** Send JSON response */
function json(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/** Main route handler */
export async function handleGuardianRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // ── GET /guardian/status ──
    if (url === '/guardian/status' && method === 'GET') {
      json(res, 200, {
        health: guardianState.latestSnapshot,
        alerts: guardianState.latestAlerts,
        aiAnalysis: guardianState.latestAIAnalysis,
        logs: getEvents(50),
        recoveries: guardianState.lastRecoveries.slice(-10),
      });
      return;
    }

    // ── POST /guardian/analyze ──
    if (url === '/guardian/analyze' && method === 'POST') {
      logEvent('MANUAL_ANALYSIS', 'Manual AI analysis triggered via API', 'warning');
      const result = await triggerManualAnalysis();
      json(res, 200, {
        snapshot: result.snapshot,
        alerts: result.alerts,
        analysis: result.analysis,
      });
      return;
    }

    // ── POST /guardian/recover ──
    if (url === '/guardian/recover' && method === 'POST') {
      const body = await parseBody(req);
      const action = body.action as RecoveryAction;
      const validActions: RecoveryAction[] = [
        'RESTART_KEEPER', 'SWITCH_RPC', 'RETRY_SETTLEMENT',
        'PAUSE_MARKETS', 'RESUME_MARKETS', 'CLEAR_QUEUE', 'NOTIFY_ADMIN',
      ];
      if (!action || !validActions.includes(action)) {
        json(res, 400, { error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
        return;
      }
      logEvent('MANUAL_RECOVERY', `Manual recovery triggered: ${action}`, 'warning');
      const result = await executeRecovery(action);
      json(res, 200, result);
      return;
    }

    // ── GET /guardian/logs ──
    if (url === '/guardian/logs' && method === 'GET') {
      json(res, 200, { logs: getEvents(200) });
      return;
    }

    // ── POST /guardian/simulate/* ──
    if (url === '/guardian/simulate/keeper-crash' && method === 'POST') {
      guardianState.keeperCrashed = true;
      guardianState.keeperAlive = false;
      logEvent('SIMULATION', 'Keeper crash simulated — heartbeat stopped', 'critical');
      json(res, 200, { injected: 'keeper-crash', message: 'Keeper crash simulated. Guardian will detect and recover.' });
      return;
    }

    if (url === '/guardian/simulate/rpc-slow' && method === 'POST') {
      guardianState.simulateRpcSlow = true;
      logEvent('SIMULATION', 'Slow RPC simulated — latency set to 2500ms', 'critical');
      json(res, 200, { injected: 'rpc-slow', message: 'Slow RPC simulated. Guardian will detect and switch.' });
      return;
    }

    if (url === '/guardian/simulate/oracle-stale' && method === 'POST') {
      guardianState.simulateOracleStale = true;
      logEvent('SIMULATION', 'Stale oracle simulated — price feed frozen', 'critical');
      json(res, 200, { injected: 'oracle-stale', message: 'Stale oracle simulated. Guardian will detect.' });
      return;
    }

    if (url === '/guardian/simulate/reset' && method === 'POST') {
      guardianState.keeperCrashed = false;
      guardianState.keeperAlive = true;
      guardianState.simulateRpcSlow = false;
      guardianState.simulateOracleStale = false;
      guardianState.lastHeartbeat = Date.now();
      logEvent('SIMULATION', 'All simulations cleared', 'healthy');
      json(res, 200, { message: 'All failure simulations cleared.' });
      return;
    }

    // ── 404 ──
    json(res, 404, { error: `Unknown guardian route: ${method} ${url}` });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent('ROUTE_ERROR', `Request error: ${method} ${url} — ${msg}`, 'critical');
    json(res, 500, { error: msg });
  }
}
