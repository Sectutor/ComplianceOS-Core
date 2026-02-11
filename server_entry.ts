// Server Entry Point - Touched for restart at 2026-02-11 16:55
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from './packages/core/src/routers';
import { authMiddleware } from './packages/core/src/authMiddleware';
import { getDb } from './packages/core/src/db';
import { sql } from 'drizzle-orm';
import { exportRouter } from './packages/core/src/server/routers/export';
import { uploadRouter } from './packages/core/src/server/routers/upload';
import { aiRouter } from './packages/core/src/server/routers/ai';
import * as threatScheduler from './packages/core/src/server/services/threatScheduler';

export const app = express();
const port = process.env.PORT || 3002;
// Force restart
console.log(`[Server] Initializing... Last update: ${new Date().toISOString()}`);

console.log('[Server Start] Environment Check:');
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'MISSING'}`);
console.log(`- SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'MISSING'}`);
console.log(`- EDITION: ${process.env.VITE_ENABLE_PREMIUM === 'false' ? 'CORE (Open Source)' : 'PREMIUM (Full Access)'}`);


// Add request logging for ALL routes BEFORE anything else
app.use((req, res, next) => {
    console.log(`[Incoming] ${req.method} ${req.url}`);
    next();
});

// Configure CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
console.log('[CORS] Allowed Origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost, configured origins, Netlify domains, and production domain
        if (
            allowedOrigins.indexOf(origin) !== -1 ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            origin.endsWith('.netlify.app') ||
            origin === 'https://grcompliance.netlify.app' ||
            origin === 'https://grcompliance.com' ||
            origin === 'https://www.grcompliance.com' || true // Permissive for debugging
        ) {
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

// Apply Authentication Middleware to populate req.user
app.use(authMiddleware);

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), update: '2026-02-07 12:20' });
});


// Production Diagnostics Endpoint
app.get('/api/debug/connection', async (req, res) => {
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
// APIs
app.use('/api/export', exportRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);

// Serve uploads statically for local development
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

// Global error handler to ensure all errors return JSON
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

// TRPC Endpoint
app.use((req, res, next) => {
    if (req.path.startsWith('/api/trpc')) {
        console.log(`[TRPC Debug] ${req.method} ${req.url}`);
        console.log(`[TRPC Debug] Content-Type: ${req.headers['content-type']}`);
        console.log(`[TRPC Debug] Body keys: ${Object.keys(req.body || {})}`);
        if (req.method === 'POST') {
            // Safe log for potential base64 data - truncate
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


// Only listen locally, Netlify calls the handler directly
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
    app.listen(Number(port), '127.0.0.1', () => {
        console.log(`\n🚀 Server listening specifically on http://127.0.0.1:${port}`);
        console.log(`-> Health check: http://127.0.0.1:${port}/health`);
        console.log(`-> TRPC endpoint: http://127.0.0.1:${port}/api/trpc\n`);
    });
}

