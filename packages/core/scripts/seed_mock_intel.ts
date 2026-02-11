import { getDb } from '../src/db';
import { assetCveMatches, nvdCveCache } from '../src/schema';
import { eq } from 'drizzle-orm';

async function seedMockIntel() {
    const db = await getDb();
    if (!db) return;

    // First ensure we have at least one real CVE in cache to link to
    const existingCve = await db.select().from(nvdCveCache).limit(1);

    let cveId = "CVE-2023-44487"; // HTTP/2 Rapid Reset
    if (existingCve.length > 0) {
        cveId = existingCve[0].cveId;
    } else {
        // Upsert a known one
        await db.insert(nvdCveCache).values({
            cveId: "CVE-2023-44487",
            description: "The HTTP/2 protocol allows a denial of service (server resource consumption) via a request cancellation at scale, as exploited in the wild in August through October 2023.",
            cvssScore: "7.5",
            publishedAt: new Date("2023-10-10"),
            lastModifiedAt: new Date()
        }).onConflictDoNothing();
    }

    console.log("Seeding a mock match for Client 3 Asset 175...");
    await db.insert(assetCveMatches).values({
        clientId: 3,
        assetId: 175, // Dell XPS
        cveId: cveId,
        matchScore: 85,
        matchReason: "Direct product match found in technical scan",
        isKev: true,
        status: 'suggested',
        discoveredAt: new Date()
    }).onConflictDoNothing();

    console.log("Done.");
}

seedMockIntel().catch(console.error);
