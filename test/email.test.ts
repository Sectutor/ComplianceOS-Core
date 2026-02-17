import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import { db } from '../db';
import { schema } from '../db'; // Assuming schema export from db or separate file
import { eq, and } from 'drizzle-orm';
import { emailMessages } from '../schema';

// Mock context with a user session
const createCaller = (userId: number, role: string) => {
    return appRouter.createCaller({
        user: { id: userId, email: 'test@example.com', role },
        session: { user: { id: userId, email: 'test@example.com' } } as any,
        req: {} as any,
        res: {} as any
    });
};

describe('Email Router', () => {
    const clientId = 1;
    const userId = 1;
    let emailId: number;

    it('should create a draft email', async () => {
        const caller = createCaller(userId, 'admin');
        const draft = await caller.email.createDraft({
            clientId,
            subject: "Test Move",
            body: "Content",
            to: ["recipient@example.com"]
        });
        emailId = draft.id;
        expect(draft.folder).toBe('drafts');
    });

    it('should move email to trash', async () => {
        const caller = createCaller(userId, 'admin');
        await caller.email.move({
            clientId,
            id: emailId,
            folder: 'trash'
        });

        const msg = await caller.email.get({ clientId, id: emailId });
        expect(msg?.folder).toBe('trash');
    });

    it('should move email to archive', async () => {
        const caller = createCaller(userId, 'admin');
        await caller.email.move({
            clientId,
            id: emailId,
            folder: 'archive'
        });

        const msg = await caller.email.get({ clientId, id: emailId });
        expect(msg?.folder).toBe('archive');
    });

    it('should permanently delete email from trash', async () => {
        const caller = createCaller(userId, 'admin');

        // Move to trash first
        await caller.email.move({ clientId, id: emailId, folder: 'trash' });

        // Permanent delete
        await caller.email.permanentDelete({ clientId, id: emailId });

        const msg = await caller.email.get({ clientId, id: emailId });
        expect(msg).toBeUndefined();
    });
});
