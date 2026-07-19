"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGuardianRequest = handleGuardianRequest;
const state_1 = require("./state");
const logger_1 = require("./logger");
const logger_2 = require("./logger");
const recovery_1 = require("./recovery");
const monitor_1 = require("./monitor");
// ── Guardian HTTP Route Handler ─────────────────────────────────────────────
// Handles all /guardian/* routes on the keeper's existing HTTP server.
/** Parse JSON body from incoming request */
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}
/** Send JSON response */
function json(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
/** Main route handler */
async function handleGuardianRequest(req, res) {
    const url = req.url || '';
    const method = req.method || 'GET';
    try {
        // ── GET /api/market-phase — authoritative phase for the frontend ──────
        // Returns the keeper's last computed phase, derived from block.timestamp.
        // The frontend polls this every 5s to stay synchronized with chain state.
        if (url === '/api/market-phase' && method === 'GET') {
            const snap = state_1.guardianState.phaseSnapshot;
            if (!snap) {
                json(res, 503, { error: 'phase not yet computed — keeper may be starting up' });
                return;
            }
            // Include staleness flag so the frontend can detect keeper downtime
            const staleMs = Date.now() - snap.updatedAt;
            json(res, 200, { ...snap, staleMs, isStale: staleMs > 30000 });
            return;
        }
        // ── GET /guardian/status ──
        if (url === '/guardian/status' && method === 'GET') {
            json(res, 200, {
                health: state_1.guardianState.latestSnapshot,
                alerts: state_1.guardianState.latestAlerts,
                aiAnalysis: state_1.guardianState.latestAIAnalysis,
                logs: (0, logger_1.getEvents)(50),
                recoveries: state_1.guardianState.lastRecoveries.slice(-10),
            });
            return;
        }
        // ── POST /guardian/analyze ──
        if (url === '/guardian/analyze' && method === 'POST') {
            (0, logger_2.logEvent)('MANUAL_ANALYSIS', 'Manual AI analysis triggered via API', 'warning');
            const result = await (0, monitor_1.triggerManualAnalysis)();
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
            const action = body.action;
            const validActions = [
                'RESTART_KEEPER', 'SWITCH_RPC', 'RETRY_SETTLEMENT',
                'PAUSE_MARKETS', 'RESUME_MARKETS', 'CLEAR_QUEUE', 'NOTIFY_ADMIN',
            ];
            if (!action || !validActions.includes(action)) {
                json(res, 400, { error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
                return;
            }
            (0, logger_2.logEvent)('MANUAL_RECOVERY', `Manual recovery triggered: ${action}`, 'warning');
            const result = await (0, recovery_1.executeRecovery)(action);
            json(res, 200, result);
            return;
        }
        // ── GET /guardian/logs ──
        if (url === '/guardian/logs' && method === 'GET') {
            json(res, 200, { logs: (0, logger_1.getEvents)(200) });
            return;
        }
        // ── POST /guardian/simulate/* ──
        if (url === '/guardian/simulate/keeper-crash' && method === 'POST') {
            state_1.guardianState.keeperCrashed = true;
            state_1.guardianState.keeperAlive = false;
            (0, logger_2.logEvent)('SIMULATION', 'Keeper crash simulated — heartbeat stopped', 'critical');
            json(res, 200, { injected: 'keeper-crash', message: 'Keeper crash simulated. Guardian will detect and recover.' });
            return;
        }
        if (url === '/guardian/simulate/rpc-slow' && method === 'POST') {
            state_1.guardianState.simulateRpcSlow = true;
            (0, logger_2.logEvent)('SIMULATION', 'Slow RPC simulated — latency set to 2500ms', 'critical');
            json(res, 200, { injected: 'rpc-slow', message: 'Slow RPC simulated. Guardian will detect and switch.' });
            return;
        }
        if (url === '/guardian/simulate/oracle-stale' && method === 'POST') {
            state_1.guardianState.simulateOracleStale = true;
            (0, logger_2.logEvent)('SIMULATION', 'Stale oracle simulated — price feed frozen', 'critical');
            json(res, 200, { injected: 'oracle-stale', message: 'Stale oracle simulated. Guardian will detect.' });
            return;
        }
        if (url === '/guardian/simulate/reset' && method === 'POST') {
            state_1.guardianState.keeperCrashed = false;
            state_1.guardianState.keeperAlive = true;
            state_1.guardianState.simulateRpcSlow = false;
            state_1.guardianState.simulateOracleStale = false;
            state_1.guardianState.lastHeartbeat = Date.now();
            (0, logger_2.logEvent)('SIMULATION', 'All simulations cleared', 'healthy');
            json(res, 200, { message: 'All failure simulations cleared.' });
            return;
        }
        // ── 404 ──
        json(res, 404, { error: `Unknown guardian route: ${method} ${url}` });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        (0, logger_2.logEvent)('ROUTE_ERROR', `Request error: ${method} ${url} — ${msg}`, 'critical');
        json(res, 500, { error: msg });
    }
}
//# sourceMappingURL=routes.js.map