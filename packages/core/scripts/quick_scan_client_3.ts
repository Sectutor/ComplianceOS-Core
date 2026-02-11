import { getDb } from '../src/db';
import { assets } from '../src/schema';
import { eq, or } from 'drizzle-orm';
import * as threatIntel from '../src/lib/threatIntelligence';

async function quickScan() {
    const db = await getDb();
    if (!db) return;

    const targetAssets = await db.select()
        .from(assets)
        .where(or(
            eq(assets.id, 207),
            eq(assets.id, 216),
            eq(assets.id, 202)
        ));

    console.log(`Targeting ${targetAssets.length} assets for quick scan...`);

    for (const asset of targetAssets) {
        console.log(`Scanning ${asset.name}...`);
        try {
            const suggestions = await threatIntel.scanAssetForCves(asset);
            console.log(` - Found ${suggestions.length} suggestions for ${asset.name}`);
            // Wait to avoid rate limit
            await new Promise(resolve => setTimeout(resolve, 6500));
        } catch (e) {
            console.error(`Error scanning ${asset.name}:`, e);
        }
    }
}

quickScan().catch(console.error);
