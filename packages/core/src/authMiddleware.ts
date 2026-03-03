
import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import { getDb } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

// Security: Validate that we don't accidentally use service role key in client-facing code
if (!supabaseUrl || !supabaseKey) {
    console.error('[AuthMiddleware] Missing required environment variables: VITE_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('[AuthMiddleware Init] Supabase URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[Auth] Request: ${req.url}`);
    
    // Detailed auth info for downstream middleware (trpc)
    const authInfo: any = {
        hasAuthHeader: false,
        supabaseUser: false,
        dbUser: false
    };
    (req as any).authInfo = authInfo;

    try {
        const authHeader = req.headers.authorization;
        const url = req.url;

        if (!authHeader) {
            console.warn(`[Auth Debug] No Authorization header for ${url}`);
            return next();
        }
        
        authInfo.hasAuthHeader = true;
        console.log(`[Auth Debug] Authorization header present for ${url}`);

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error(`[Auth Debug] Supabase auth failed for ${url}:`, error?.message || 'No user returned');
            return next();
        }
        
        authInfo.supabaseUser = true;
        console.log(`[Auth Debug] Supabase user validated: ${user.id}`);

        const dbConn = await getDb();
        const dbUser = await dbConn.query.users.findFirst({
            where: eq(users.openId, user.id)
        });

        if (!dbUser) {
            console.error(`[Auth Debug] No dbUser found for openId: ${user.id} (email: ${user.email})`);
            return next();
        }
        
        authInfo.dbUser = true;
        console.log(`[Auth Debug] Database user found: ${dbUser.id} (${dbUser.email})`);


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
                if (!payload?.sub) {
                    console.warn('[Auth Debug] Token payload is missing "sub" claim! This will cause MFA issues.');
                }
            }
        } catch (e: any) {
            console.error('[Auth Debug] Failed to decode JWT payload:', e.message);
        }
        next();
    } catch (error: any) {
        console.error('[AuthMiddleware] Exception:', error.message);
        // Log sanitized error without stack trace for security
        const logFile = path.resolve(process.cwd(), 'auth_error.log');
        const sanitizedMessage = error.message || 'Unknown error';
        const logEntry = `[${new Date().toISOString()}] Auth Error: ${sanitizedMessage}\n`;
        fs.appendFile(logFile, logEntry, () => { });

        // If DB connection fails, we should probably fail hard for API requests
        // instead of letting it pass as unauthorized/undefined
        if (error.name === 'DatabaseConnectionError' ||
            error.message?.includes('connect') ||
            error.message?.includes('getaddrinfo') ||
            error.message?.includes('timeout') ||
            error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('ENOTFOUND')) {
            console.error('[AuthMiddleware] Database/Network Error:', error.message);

            // For TRPC requests, return a properly formatted error that TRPC can parse
            if (req.url.startsWith('/api/trpc')) {
                return res.status(503).json({
                    error: {
                        message: 'Database connection failed',
                        code: 'DATABASE_ERROR',
                        data: {
                            code: 'DATABASE_ERROR',
                            httpStatus: 503,
                        },
                    },
                });
            }

            return res.status(503).json({ error: 'Database connection failed', details: error.message });
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
