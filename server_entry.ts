// CRITICAL: Polyfill MUST run before any other code is evaluated
(function polyfill() {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : {};

    // Core Graphics
    if (typeof g.DOMMatrix === 'undefined') {
        g.DOMMatrix = class DOMMatrix {
            constructor() { }
            static fromFloat32Array() { return new DOMMatrix(); }
            static fromFloat64Array() { return new DOMMatrix(); }
            static fromMatrix() { return new DOMMatrix(); }
        };
        if (typeof global !== 'undefined') (global as any).DOMMatrix = g.DOMMatrix;
    }

    // Minimal Location for libraries that expect it
    if (typeof (g as any).location === 'undefined') {
        (g as any).location = {
            href: 'https://app.grcompliance.com/',
            origin: 'https://app.grcompliance.com',
            protocol: 'https:',
            host: 'app.grcompliance.com',
            hostname: 'app.grcompliance.com',
            pathname: '/',
            search: '',
            hash: '',
            toString: () => 'https://app.grcompliance.com/',
        };
    }
})();

import './env-loader';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './packages/core/src/routers';
import { createContext } from './packages/core/src/server/context';
import { authMiddleware } from './packages/core/src/authMiddleware';
import { getDb, resetDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';
import { exportRouter } from './packages/core/src/server/routers/export';
import { uploadRouter } from './packages/core/src/server/routers/upload';
import { aiRouter } from './packages/core/src/server/routers/ai';
import { gumroadWebhookRouter } from './packages/core/src/server/webhooks/gumroad';
import * as threatScheduler from './packages/core/src/server/services/threatScheduler';
import * as licenseRenewalScheduler from './packages/core/src/server/services/licenseRenewalScheduler';
import * as policyReviewScheduler from './packages/core/src/server/services/policyReviewScheduler';
import redis from './packages/core/src/lib/redis';
import { rateLimit } from 'express-rate-limit';
import { validateSecrets } from './packages/core/src/lib/secrets';

// V14.1.2: Strict production secrets validation (AL 3)
validateSecrets();
import helmet from 'helmet';

export const app = express();

// Health Check - Moving to top to bypass potential middleware issues
app.get(['/health', '/api/health'], async (req, res) => {
    try {
        const dbConn = await getDb();
        await dbConn.execute(sql`SELECT 1`);
        res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (e: any) {
        console.error('[Health] Database connection check failed:', e);
        res.status(503).json({ status: 'error', database: 'disconnected', details: e.message });
    }
});
const port = process.env.PORT || 3002;
// Force restart
console.log(`[Server] Initializing... Last update: ${new Date().toISOString()}`);

process.on('uncaughtException', (err: any) => {
    console.error('[FATAL] Uncaught Exception:', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
        details: err
    });
    // Reset DB pool on connection-related errors to allow recovery
    if (err?.code === 'ERR_INVALID_ARG_TYPE' || err?.message?.includes('connect') || err?.message?.includes('address')) {
        console.warn('[DB] Resetting DB pool due to uncaughtException...');
        resetDb().catch(() => { });
    }
    // Do NOT exit — let the server recover gracefully
});

process.on('unhandledRejection', (reason: any, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // Reset DB pool on connection-related errors so the next request reconnects cleanly
    if (reason?.code === 'ERR_INVALID_ARG_TYPE' || reason?.message?.includes('connect') || reason?.message?.includes('address') || reason?.code === 'ECONNRESET' || reason?.code === 'ECONNREFUSED') {
        console.warn('[DB] Resetting DB pool due to unhandledRejection...');
        resetDb().catch(() => { });
    }
    // Do NOT exit — TRPC and Express will surface the error as a 500
});

console.log('[Server Start] Environment Check:');
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'MISSING'}`);
console.log(`- SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'MISSING'}`);
console.log(`- EDITION: ${process.env.VITE_ENABLE_PREMIUM === 'false' ? 'CORE (Open Source)' : 'PREMIUM (Full Access)'}`);
console.log(`- REDIS: ${process.env.REDIS_HOST ? 'Configured' : 'Disabled'}`);


// Add request logging for ALL routes BEFORE anything else
app.use((req, res, next) => {
    console.log(`[Incoming] ${req.method} ${req.url}`);
    next();
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co", "https://*.netlify.app", "https://grcompliance.com"],
        },
    },
}));

// Configure CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
console.log('[CORS] Allowed Origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Strict origin validation
        const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
        const isAllowedProd =
            allowedOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.netlify.app') ||
            origin === 'https://grcompliance.netlify.app' ||
            origin === 'https://grcompliance.com' ||
            origin === 'https://www.grcompliance.com';

        // Always allow localhost/127.0.0.1 for local development ease, regardless of NODE_ENV
        // This unblocks local testing where ports might vary (e.g., landing on 5174, app on 5173)
        if (isAllowedProd || isLocal) {
            callback(null, true);
        } else {
            console.error(`[CORS] Rejected origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Parse JSON bodies (though TRPC handles its own, auth middleware might need it if used for other routes)
// Parse JSON bodies with increased limit for uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
if (process.env.RATE_LIMITING_ENABLED === 'true') {
    const limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { status: 429, message: 'Too many requests, please try again later.' }
    });
    app.use('/api/', limiter);
    console.log(`[RateLimit] Enabled: ${process.env.RATE_LIMIT_MAX_REQUESTS} reqs / ${process.env.RATE_LIMIT_WINDOW_MS}ms`);
}

// Apply Authentication Middleware to populate req.user
app.use(authMiddleware);

// Secure static uploads - must be after authMiddleware
app.use('/uploads', (req: any, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required for media access' });
    }
    // Optional: Check client_id in path if we structure uploads by client
    next();
}, express.static(path.join(process.cwd(), 'uploads')));



// Production Diagnostics Endpoint - Restricted to Admins
// Diagnostic endpoint to check polyfills
app.get(['/debug/globals', '/api/debug/globals'], (req: express.Request, res: express.Response) => {
    const g = global as any;
    res.json({
        DOMMatrix: typeof g.DOMMatrix,
        window: typeof g.window,
        document: typeof g.document,
        location: typeof g.location,
        location_type: Object.prototype.toString.call(g.location),
        location_href: g.location?.href,
        navigator: typeof g.navigator,
        userAgent: g.navigator?.userAgent,
        process_env_NETLIFY: !!process.env.NETLIFY,
        process_env_NODE_ENV: process.env.NODE_ENV,
    });
});

app.get(['/debug/connection', '/api/debug/connection'], async (req: any, res) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Unauthorized diagnostic access' });
    }
    try {
        const db = await getDb();
        const start = Date.now();
        // Simple query to verify connection
        const result = await db.execute(sql`SELECT 1 as connected`);
        const duration = Date.now() - start;

        res.json({
            status: 'success',
            message: 'Database connection successful',
            duration: `${duration}ms`,
            env: {
                has_db_url: !!process.env.DATABASE_URL,
                db_url_length: process.env.DATABASE_URL?.length || 0,
                db_url_protocol: process.env.DATABASE_URL?.split('://')[0] || 'unknown',
                has_supabase_url: !!process.env.VITE_SUPABASE_URL,
                has_supabase_key: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
                node_env: process.env.NODE_ENV,
            },
            result: result
        });
    } catch (error: any) {
        console.error('[Diagnostics] DB Connection Failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error_code: error.code,
            error_message: error.message,
            env_check: {
                has_db_url: !!process.env.DATABASE_URL,
                db_url_start: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'MISSING',
            }
        });
    }
});
// APIs
app.use('/api/export', exportRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/webhooks', gumroadWebhookRouter);

// Redundant local uploads removed for security
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve static files in production (Docker)
if (process.env.NODE_ENV === 'production' && !process.env.NETLIFY) {
    console.log('[Server] Serving static files from packages/core/dist');
    const distPath = path.join(__dirname, 'packages/core/dist');
    app.use(express.static(distPath));

    // Handle SPA routing - return index.html for any unknown non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// TRPC Endpoint
// Note: TRPC middleware already handles request logging via onError callback
// Removed monkey-patching of res.send as it's fragile and can break Express handling

// TRPC Endpoint with request logging
app.use(
    '/api/trpc',
    (req, res, next) => {
        console.log(`[TRPC Request] ${req.method} ${req.url} - Content-Type: ${req.headers['content-type']}`);
        next();
    },
    createExpressMiddleware({
        router: appRouter,
        createContext,
        onError: ({ error, type, path, req }) => {
            console.error(`[TRPC] ${type} error on ${path}:`, {
                code: error.code,
                message: error.message,
                stack: error.stack,
            });
        },
    })
);

// Optional background syncs
if (process.env.ENABLE_THREAT_SCHEDULER === 'true') {
    threatScheduler.start();
}

// License renewal scheduler
if (process.env.ENABLE_LICENSE_RENEWAL_SCHEDULER === 'true') {
    licenseRenewalScheduler.start();
    console.log('[Server] License renewal scheduler started');
}

// Policy review scheduler
if (process.env.ENABLE_POLICY_REVIEW_SCHEDULER !== 'false') {
    policyReviewScheduler.start();
    console.log('[Server] Policy review scheduler started');
}

// Global error handler to ensure all errors return JSON - MUST BE LAST
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });

    if (res.headersSent) {
        return next(err);
    }

    // Handle database connection errors specifically
    const isDbError = err.message?.includes('connect') ||
        err.message?.includes('database') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND') ||
        err.message?.includes('timeout');

    const statusCode = isDbError ? 503 : 500;
    const errorCode = isDbError ? 'DATABASE_ERROR' : 'INTERNAL_SERVER_ERROR';
    const errorMessage = isDbError
        ? 'Database connection error. Please try again later.'
        : (err.message || 'Internal Server Error');

    // Ensure response is always JSON, even for critical errors
    res.status(statusCode).json({
        message: errorMessage,
        code: errorCode,
        data: null,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Only listen locally, Netlify calls the handler directly
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
    const listenAddr = process.env.LISTEN_ADDR || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
    const server = app.listen(Number(port), listenAddr, () => {
        console.log(`\n🚀 Server listening specifically on http://${listenAddr}:${port}`);
        console.log(`-> Health check: http://${listenAddr}:${port}/health`);
        console.log(`-> TRPC endpoint: http://${listenAddr}:${port}/api/trpc\n`);
    });
    server.timeout = 300000; // 5 minutes 
}




