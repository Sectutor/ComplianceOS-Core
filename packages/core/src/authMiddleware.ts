
import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import { getDb } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

console.log('[AuthMiddleware Init] Supabase URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[Auth] Request: ${req.url}`);
    try {
        const authHeader = req.headers.authorization;
        const url = req.url;

        if (!authHeader) {
            if (url.includes('/ai/generate-stream')) {
                console.log('[Auth Debug] No Authorization header for AI stream');
            }
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        if (url.includes('/ai/generate-stream')) {
            console.log('[Auth Debug] Attempting Supabase lookup for token...');
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            if (url.includes('/ai/generate-stream')) {
                console.error('[Auth Debug] Supabase error or no user:', error?.message);
            }
            return next();
        }

        if (url.includes('/ai/generate-stream')) {
            console.log('[Auth Debug] Supabase user found:', user.id, user.email);
        }

        const dbConn = await getDb();
        const dbUser = await dbConn.query.users.findFirst({
            where: eq(users.openId, user.id)
        });

        if (!dbUser) {
            if (url.includes('/ai/generate-stream')) {
                console.error('[Auth Debug] No dbUser found for openId:', user.id);
            }
            return next();
        }

        if (url.includes('/ai/generate-stream')) {
            console.log('[Auth Debug] dbUser found:', dbUser.id, dbUser.role);
        }

        console.log('[Auth Debug] Setting req.user:', { id: dbUser.id, role: dbUser.role, email: dbUser.email });
        req.user = dbUser;
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
                (req as any).aal = payload?.aal || null;
            }
        } catch { }
        next();
    } catch (error: any) {
        console.error('[AuthMiddleware] Exception:', error.message);
        // Log details to help debug the 500 error
        const fs = await import('fs');
        const path = await import('path');
        const logFile = path.resolve(process.cwd(), 'auth_error.log');
        const logEntry = `[${new Date().toISOString()}] ${error.stack}\n`;
        fs.appendFile(logFile, logEntry, () => { });

        // If DB connection fails, we should probably fail hard for API requests
        // instead of letting it pass as unauthorized/undefined
        if (error.name === 'DatabaseConnectionError' || error.message.includes('connect')) {
            res.status(503).json({ error: 'Database connection failed' });
            return;
        }

        // Don't just next() on error, send a proper error response if we can't authenticate
        // Otherwise trpc gets undefined user and throws generic 500 or 401 later
        if (req.url.startsWith('/api/trpc')) {
            res.status(500).json({
                error: 'Internal Authentication Error',
                details: error.message
            });
            return;
        }

        next();
    }
};
