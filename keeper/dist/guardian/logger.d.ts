import type { LogEvent, Severity } from './types';
export declare function logEvent(type: string, message: string, severity?: Severity, metadata?: Record<string, unknown>): LogEvent;
export declare function getEvents(limit?: number): LogEvent[];
export declare function getEventsSince(since: number): LogEvent[];
//# sourceMappingURL=logger.d.ts.map