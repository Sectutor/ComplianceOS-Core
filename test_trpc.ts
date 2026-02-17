
import { appRouter, createContext } from "./packages/core/src/routers.ts";
import { getDb } from "./packages/core/src/db.ts";
import { users } from "./packages/core/src/schema.ts";
import { eq } from "drizzle-orm";

async function test() {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, 'emmanuel@intellfence.com')).limit(1);

    const ctx = {
        user,
        clientId: 3,
        req: { headers: { 'x-client-id': '3' } } as any,
        res: {} as any,
    };

    const caller = appRouter.createCaller(ctx as any);

    try {
        const client = await caller.clients.get({ id: 3 });
        console.log('Client Get Success:', JSON.stringify(client, null, 2));
    } catch (e) {
        console.error('Client Get Failed:', e);
    }
    process.exit(0);
}

test();
