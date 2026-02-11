import { getDb } from '../src/db';
import { assets } from '../src/schema';
import { eq } from 'drizzle-orm';

async function findAsset() {
    const db = await getDb();
    if (!db) return;

    const a = await db.select().from(assets).where(eq(assets.id, 92));
    console.log("Asset 92:", a);
}

findAsset().catch(console.error);
