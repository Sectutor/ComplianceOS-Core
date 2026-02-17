import { middleware } from "./trpc-base";
import { logger } from "../lib/logger";

/**
 * Performance Tracking Middleware
 * Logs slow requests and collects metrics
 */
export const performanceTracker = middleware(async ({ path, type, next }) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;

    if (duration > (Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 500)) {
        logger.warn({
            message: 'Slow TRPC Request',
            path,
            type,
            duration: `${duration}ms`,
            clientId: (result as any)?.ctx?.clientId
        });
    }

    return result;
});

/**
 * Utility to sanitize mutation input for logging
 * Removes sensitive fields like passwords, tokens, and binary data
 */
function sanitizeInput(input: any): any {
    if (!input || typeof input !== 'object') return input;

    // Deep clone to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(input));
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'data', 'content'];

    const clean = (obj: any) => {
        for (const key in obj) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                clean(obj[key]);
            }
        }
    };

    clean(sanitized);
    return sanitized;
}

/**
 * Enterprise Audit Logging
 * Logs all mutation requests for compliance audit trails with attribution
 */
export const auditLogger = middleware(async (opts: any) => {
    const { path, type, next, ctx, rawInput } = opts;
    const result = await next();

    if (type === 'mutation') {
        const context = ctx as any;
        logger.info({
            message: 'Audit Log: Mutation',
            path,
            user: context.user?.email || 'unauthenticated',
            userId: context.user?.id,
            clientId: context.clientId,
            status: result.ok ? 'success' : 'failed',
            ip: context.ip,
            userAgent: context.userAgent,
            input: result.ok ? sanitizeInput(rawInput) : undefined, // Only log input on success to avoid cluttering errors
            errorCode: !result.ok ? (result as any).error?.code : undefined
        });
    }

    return result;
});
