// Server Entry Point - Touched for restart at 2026-02-17 07:15
import './env-loader';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './packages/core/src/routers';
import { createContext } from './packages/core/src/server/context';
import { authMiddleware } from './packages/core/src/authMiddleware';
import { getDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';
import { exportRouter } from './packages/core/src/server/routers/export';
import { uploadRouter } from './packages/core/src/server/routers/upload';
import { aiRouter } from './packages/core/src/server/routers/ai';
import { gumroadWebhookRouter } from './packages/core/src/server/webhooks/gumroad';
import * as threatScheduler from './packages/core/src/server/services/threatScheduler';
import * as licenseRenewalScheduler from './packages/core/src/server/services/licenseRenewalScheduler';
import redis from './packages/core/src/lib/redis';
import { rateLimit } from 'express-rate-limit';
import { validateSecrets } from './packages/core/src/lib/secrets';

// V14.1.2: Strict production secrets validation (AL 3)
validateSecrets();
import helmet from 'helmet';

export const app = express();
const port = process.env.PORT || 3002;
// Force restart
console.log(`[Server] Initializing... Last update: ${new Date().toISOString()}`);

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
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

        if (isAllowedProd || (isLocal && process.env.NODE_ENV !== 'production')) {
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

// Health Check
app.get('/health', async (req, res) => {
    try {
        const dbConn = await getDb();
        await dbConn.execute(sql`SELECT 1`);
        res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (e: any) {
        console.error('[Health] Database connection check failed:', e);
        res.status(503).json({ status: 'error', database: 'disconnected', details: e.message });
    }
});


// Production Diagnostics Endpoint - Restricted to Admins
app.get('/api/debug/connection', async (req: any, res) => {
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
app.use((req, res, next) => {
    if (req.path.startsWith('/api/trpc')) {
        console.log(`[TRPC Debug] ${req.method} ${req.url}`);
        console.log(`[TRPC Debug] Content-Type: ${req.headers['content-type']}`);
        if (req.method === 'POST') {
            const bodyStr = req.body ? JSON.stringify(req.body) : '{}';
            console.log(`[TRPC Debug] Body: ${bodyStr.substring(0, 500)}...`);
        }
    }
    next();
});

app.use(
    '/api/trpc',
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

    res.status(500).json({
        message: err.message || 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR',
        data: null,
    });
});

// Only listen locally, Netlify calls the handler directly
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
    const listenAddr = process.env.LISTEN_ADDR || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
    app.listen(Number(port), listenAddr, () => {
        console.log(`\n🚀 Server listening specifically on http://${listenAddr}:${port}`);
        console.log(`-> Health check: http://${listenAddr}:${port}/health`);
        console.log(`-> TRPC endpoint: http://${listenAddr}:${port}/api/trpc\n`);
    });
}
