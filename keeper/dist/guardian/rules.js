"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRules = evaluateRules;
exports.worstSeverity = worstSeverity;
// ── Deterministic Rule Engine ───────────────────────────────────────────────
// Phase 2: Evaluate health rules before AI analysis.
// Each rule checks a condition and emits an Alert if triggered.
let alertCounter = 0;
function createAlert(rule, severity, message) {
    return {
        id: `alert-${++alertCounter}`,
        rule,
        severity,
        message,
        timestamp: Date.now(),
        resolved: false,
    };
}
const rules = [
    // ── Keeper Heartbeat ──
    {
        name: 'keeper_heartbeat',
        evaluate: (s) => {
            if (!s.keeperAlive) {
                return createAlert('keeper_heartbeat', 'critical', 'Keeper is offline — no heartbeat detected');
            }
            return null;
        },
    },
    // ── RPC Latency ──
    {
        name: 'rpc_latency',
        evaluate: (s) => {
            if (s.rpcLatency >= 9999) {
                return createAlert('rpc_latency', 'critical', `RPC unreachable (${s.rpcEndpoint})`);
            }
            if (s.rpcLatency > 1500) {
                return createAlert('rpc_latency', 'critical', `RPC latency critical: ${s.rpcLatency}ms`);
            }
            if (s.rpcLatency > 800) {
                return createAlert('rpc_latency', 'degraded', `RPC latency degraded: ${s.rpcLatency}ms`);
            }
            if (s.rpcLatency > 500) {
                return createAlert('rpc_latency', 'warning', `RPC latency elevated: ${s.rpcLatency}ms`);
            }
            return null;
        },
    },
    // ── Oracle Freshness ──
    {
        name: 'oracle_freshness',
        evaluate: (s) => {
            if (!s.oracleFresh && s.oracleLastUpdate > 10000) {
                return createAlert('oracle_freshness', 'degraded', `Oracle stale — last update ${Math.round(s.oracleLastUpdate / 1000)}s ago`);
            }
            if (!s.oracleFresh && s.oracleLastUpdate === -1) {
                return createAlert('oracle_freshness', 'critical', 'Oracle unreachable — cannot fetch price feed');
            }
            return null;
        },
    },
    // ── Timer Drift ──
    {
        name: 'timer_drift',
        evaluate: (s) => {
            if (s.phase === 'SETTLING' && s.timer < -90) {
                return createAlert('timer_drift', 'critical', `Settlement severely overdue: ${Math.abs(s.timer)}s past end`);
            }
            if (s.phase === 'SETTLING' && s.timer < -30) {
                return createAlert('timer_drift', 'degraded', `Settlement delayed: ${Math.abs(s.timer)}s past end`);
            }
            if (s.timer < -5 && s.phase !== 'RESOLVED' && s.phase !== 'CANCELED' && s.phase !== 'UNKNOWN') {
                return createAlert('timer_drift', 'warning', `Timer overdue by ${Math.abs(s.timer)}s`);
            }
            return null;
        },
    },
    // ── Failed Transactions ──
    {
        name: 'failed_tx',
        evaluate: (s) => {
            if (s.failedTx > 5) {
                return createAlert('failed_tx', 'critical', `${s.failedTx} failed transactions — possible wallet or nonce issue`);
            }
            if (s.failedTx > 0) {
                return createAlert('failed_tx', 'warning', `${s.failedTx} failed transaction(s) detected`);
            }
            return null;
        },
    },
    // ── Memory Usage ──
    {
        name: 'memory_usage',
        evaluate: (s) => {
            if (s.memoryUsage > 90) {
                return createAlert('memory_usage', 'critical', `Memory critically high: ${s.memoryUsage}%`);
            }
            if (s.memoryUsage > 75) {
                return createAlert('memory_usage', 'warning', `Memory elevated: ${s.memoryUsage}%`);
            }
            return null;
        },
    },
];
/** Evaluate all rules against a health snapshot */
function evaluateRules(snapshot) {
    const alerts = [];
    for (const rule of rules) {
        const alert = rule.evaluate(snapshot);
        if (alert) {
            alerts.push(alert);
        }
    }
    return alerts;
}
/** Get the worst severity from a set of alerts */
function worstSeverity(alerts) {
    const order = ['healthy', 'warning', 'degraded', 'critical'];
    let worst = 'healthy';
    for (const alert of alerts) {
        if (order.indexOf(alert.severity) > order.indexOf(worst)) {
            worst = alert.severity;
        }
    }
    return worst;
}
//# sourceMappingURL=rules.js.map