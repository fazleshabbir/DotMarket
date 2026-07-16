"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
exports.getEvents = getEvents;
exports.getEventsSince = getEventsSince;
// ── Event Logger ────────────────────────────────────────────────────────────
// Ring buffer of structured events for the Guardian dashboard and API.
const MAX_EVENTS = 500;
const events = [];
let eventCounter = 0;
function logEvent(type, message, severity = 'healthy', metadata) {
    const event = {
        id: `evt-${++eventCounter}`,
        type,
        message,
        severity,
        timestamp: Date.now(),
        metadata,
    };
    events.push(event);
    if (events.length > MAX_EVENTS) {
        events.shift();
    }
    // Console output with severity icon
    const icon = { healthy: '🟢', warning: '🟡', degraded: '🟠', critical: '🔴' }[severity];
    const ts = new Date().toISOString().substring(11, 19);
    console.log(`[${ts}] ${icon} [GUARDIAN:${type}] ${message}`);
    return event;
}
function getEvents(limit = 100) {
    return events.slice(-limit).reverse();
}
function getEventsSince(since) {
    return events.filter(e => e.timestamp > since).reverse();
}
//# sourceMappingURL=logger.js.map