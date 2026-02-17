import { vi } from 'vitest';
import * as dbModule from '../db';
import { appRouter } from '../routers';
import { TRPCError } from '@trpc/server';

// Mock context for authenticated user
export const createMockContext = (overrides = {}) => {
    return {
        req: {} as any,
        res: {} as any,
        user: {
            id: 99999, // Test user ID
            openId: 'test-openid',
            role: 'owner', // Default to owner/admin for access
            email: 'test@example.com',
            name: 'Test User',
            ...overrides
        },
        ...overrides
    };
};

export const createCaller = (ctx: any) => {
    return appRouter.createCaller(ctx);
};

// Helper to run a test inside a transaction and rollback
export const withTestTransaction = async (
    testFn: (tx: any, ctx: any) => Promise<void>,
    userOverrides = {}
) => {
    // Get original DB connection
    // We access the inner function implementation to avoid spying recursion if we spy globally
    // But since we spy *inside* the wrapper, it's fine.
    const db = await dbModule.getDb();

    if (!db) throw new Error('Could not connect to database');

    try {
        await db.transaction(async (tx) => {
            // Mock getDb to return the transaction client
            // This ensures all router calls use this transaction
            const spy = vi.spyOn(dbModule, 'getDb').mockResolvedValue(tx as any);

            try {
                const ctx = createMockContext(userOverrides);
                await testFn(tx, ctx);
            } finally {
                spy.mockRestore(); // Restore original getDb
                // Check if we need to rollback (always for strict isolation)
                throw new Error('ROLLBACK_TEST');
            }
        });
    } catch (e: any) {
        if (e.message !== 'ROLLBACK_TEST') {
            throw e;
        }
        // Swallowed 'ROLLBACK_TEST' is expected success path
    }
};
