import type { LogEvent, Severity } from './types';

// ── Event Logger ────────────────────────────────────────────────────────────
// Ring buffer of structured events for the Guardian dashboard and API.

const MAX_EVENTS = 500;
const events: LogEvent[] = [];
let eventCounter = 0;

export function logEvent(
  type: string,
  message: string,
  severity: Severity = 'healthy',
  metadata?: Record<string, unknown>
): LogEvent {
  const event: LogEvent = {
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

export function getEvents(limit = 100): LogEvent[] {
  return events.slice(-limit).reverse();
}

export function getEventsSince(since: number): LogEvent[] {
  return events.filter(e => e.timestamp > since).reverse();
}
