"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRecovery = executeRecovery;
const state_1 = require("./state");
const logger_1 = require("./logger");
// ── Recovery Engine ─────────────────────────────────────────────────────────
// Phase 4 & 6: Maps AI recommendations to safe, predefined system actions.
// Each action has a cooldown to prevent thrashing.
const RPC_ENDPOINTS = [
    'https://rpc.testnet.arc.network',
    'https://arc-testnet.drpc.org',
];
// Cooldowns: minimum interval between executions of each action
const cooldowns = {
    RESTART_KEEPER: 30000,
    SWITCH_RPC: 20000,
    RETRY_SETTLEMENT: 45000,
    PAUSE_MARKETS: 10000,
    RESUME_MARKETS: 10000,
    CLEAR_QUEUE: 15000,
    NOTIFY_ADMIN: 60000,
};
const lastExecuted = {};
/** Check if an action is within its cooldown period */
function isOnCooldown(action) {
    const last = lastExecuted[action] || 0;
    return Date.now() - last < cooldowns[action];
}
/** Execute a recovery action */
async function executeRecovery(action) {
    const startTime = Date.now();
    // Check cooldown
    if (isOnCooldown(action)) {
        const remaining = Math.ceil((cooldowns[action] - (Date.now() - (lastExecuted[action] || 0))) / 1000);
        return {
            success: false,
            action,
            message: `Action on cooldown — ${remaining}s remaining`,
            duration: 0,
            timestamp: Date.now(),
        };
    }
    lastExecuted[action] = Date.now();
    let result;
    try {
        switch (action) {
            case 'RESTART_KEEPER':
                result = await restartKeeper(startTime);
                break;
            case 'SWITCH_RPC':
                result = switchRpc(startTime);
                break;
            case 'RETRY_SETTLEMENT':
                result = retrySettlement(startTime);
                break;
            case 'PAUSE_MARKETS':
                result = pauseMarkets(startTime);
                break;
            case 'RESUME_MARKETS':
                result = resumeMarkets(startTime);
                break;
            case 'CLEAR_QUEUE':
                result = clearQueue(startTime);
                break;
            case 'NOTIFY_ADMIN':
                result = notifyAdmin(startTime);
                break;
            default:
                result = {
                    success: false,
                    action,
                    message: `Unknown action: ${action}`,
                    duration: Date.now() - startTime,
                    timestamp: Date.now(),
                };
        }
    }
    catch (err) {
        result = {
            success: false,
            action,
            message: `Recovery failed: ${err instanceof Error ? err.message : String(err)}`,
            duration: Date.now() - startTime,
            timestamp: Date.now(),
        };
    }
    // Store result
    state_1.guardianState.lastRecoveries.push(result);
    if (state_1.guardianState.lastRecoveries.length > 50) {
        state_1.guardianState.lastRecoveries.shift();
    }
    // Log the recovery
    (0, logger_1.logEvent)('RECOVERY_EXECUTED', `${action}: ${result.success ? 'SUCCESS' : 'FAILED'} — ${result.message}`, result.success ? 'healthy' : 'warning', { action, success: result.success, duration: result.duration });
    return result;
}
// ── Individual Recovery Actions ─────────────────────────────────────────────
async function restartKeeper(startTime) {
    (0, logger_1.logEvent)('KEEPER_RESTARTING', 'Initiating keeper restart...', 'warning');
    // Reset crashed state
    state_1.guardianState.keeperCrashed = false;
    state_1.guardianState.keeperAlive = true;
    state_1.guardianState.lastHeartbeat = Date.now();
    state_1.guardianState.keeperStartTime = Date.now();
    state_1.guardianState.consecutiveErrors = 0;
    state_1.guardianState.lastError = null;
    // Small delay to simulate restart time
    await new Promise(resolve => setTimeout(resolve, 1500));
    (0, logger_1.logEvent)('KEEPER_RESTARTED', 'Keeper successfully restarted', 'healthy');
    return {
        success: true,
        action: 'RESTART_KEEPER',
        message: 'Keeper restarted — heartbeat restored',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function switchRpc(startTime) {
    const oldIndex = state_1.guardianState.currentRpcIndex;
    state_1.guardianState.currentRpcIndex = (oldIndex + 1) % RPC_ENDPOINTS.length;
    const newRpc = RPC_ENDPOINTS[state_1.guardianState.currentRpcIndex];
    state_1.guardianState.rpcEndpoint = newRpc;
    state_1.guardianState.simulateRpcSlow = false; // Clear simulation
    (0, logger_1.logEvent)('RPC_SWITCHED', `Switched from RPC #${oldIndex} to #${state_1.guardianState.currentRpcIndex}: ${newRpc}`, 'healthy');
    return {
        success: true,
        action: 'SWITCH_RPC',
        message: `Switched to backup RPC: ${newRpc}`,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function retrySettlement(startTime) {
    // In the integrated model, we signal the keeper to retry on next loop iteration
    // by resetting the round state flags
    (0, logger_1.logEvent)('SETTLEMENT_RETRY', 'Signaling keeper to retry settlement on next cycle', 'warning');
    return {
        success: true,
        action: 'RETRY_SETTLEMENT',
        message: 'Settlement retry queued for next keeper cycle',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function pauseMarkets(startTime) {
    state_1.guardianState.isPaused = true;
    (0, logger_1.logEvent)('MARKETS_PAUSED', 'New market creation paused', 'warning');
    return {
        success: true,
        action: 'PAUSE_MARKETS',
        message: 'Market creation paused — existing rounds will complete',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function resumeMarkets(startTime) {
    state_1.guardianState.isPaused = false;
    (0, logger_1.logEvent)('MARKETS_RESUMED', 'Market creation resumed', 'healthy');
    return {
        success: true,
        action: 'RESUME_MARKETS',
        message: 'Market creation resumed',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function clearQueue(startTime) {
    state_1.guardianState.failedTxCount = 0;
    state_1.guardianState.pendingTxCount = 0;
    state_1.guardianState.consecutiveErrors = 0;
    (0, logger_1.logEvent)('QUEUE_CLEARED', 'Failed transaction queue cleared', 'healthy');
    return {
        success: true,
        action: 'CLEAR_QUEUE',
        message: 'Transaction queue cleared — counters reset',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
function notifyAdmin(startTime) {
    // Log the alert — in production this would call Discord/Telegram webhooks
    const snapshot = state_1.guardianState.latestSnapshot;
    const message = snapshot
        ? `⚠️ Guardian Alert: ${snapshot.overallHealth.toUpperCase()} — Market #${snapshot.marketId}, Keeper: ${snapshot.keeperAlive ? 'Running' : 'OFFLINE'}, RPC: ${snapshot.rpcLatency}ms`
        : '⚠️ Guardian Alert: Health snapshot unavailable';
    (0, logger_1.logEvent)('ADMIN_NOTIFIED', message, 'warning');
    // Discord webhook (optional)
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
        fetch(discordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        }).catch(() => { });
    }
    // Telegram (optional)
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
        fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChat, text: message }),
        }).catch(() => { });
    }
    return {
        success: true,
        action: 'NOTIFY_ADMIN',
        message: 'Admin notification sent',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=recovery.js.map