import { getDb } from '../src/db';
import { assetCveMatches, nvdCveCache, assets } from '../src/schema';
import { eq, desc } from 'drizzle-orm';

async function testQuery() {
    const dbConn = await getDb();
    if (!dbConn) return;

    const matches = await dbConn.select({
        matchId: assetCveMatches.id,
        cveId: assetCveMatches.cveId,
        assetId: assetCveMatches.assetId,
        assetName: assets.name,
        matchScore: assetCveMatches.matchScore,
        isKev: assetCveMatches.isKev,
        status: assetCveMatches.status,
        discoveredAt: assetCveMatches.discoveredAt,
        description: nvdCveCache.description,
        cvssScore: nvdCveCache.cvssScore,
    })
        .from(assetCveMatches)
        .innerJoin(assets, eq(assetCveMatches.assetId, assets.id))
        .leftJoin(nvdCveCache, eq(assetCveMatches.cveId, nvdCveCache.cveId))
        .where(eq(assetCveMatches.clientId, 3))
        .orderBy(desc(assetCveMatches.discoveredAt));

    console.log(`Query returned ${matches.length} results`);
    if (matches.length > 0) {
        console.log("First Match:", matches[0]);
    }
}

testQuery().catch(console.error);
