import { getDb } from "../../db";
import * as schema from "../../schema";
import * as threatIntel from "../../lib/threatIntelligence";

let kevInterval: NodeJS.Timeout | null = null;
let assetScanInterval: NodeJS.Timeout | null = null;

export async function runKevSyncOnce() {
  try {
    const count = await threatIntel.syncCisaKevCatalog();
    console.log(`[ThreatScheduler] KEV sync completed: ${count} records`);
  } catch (err) {
    console.error("[ThreatScheduler] KEV sync failed:", err);
  }
}

export async function runAssetScanOnce() {
  try {
    const db = await getDb();
    const clients = await db.select().from(schema.clients);
    for (const c of clients) {
      const results = await threatIntel.scanAllAssetsForClient(c.id);
      const total = results.reduce((sum, r) => sum + (r.count || 0), 0);
      console.log(`[ThreatScheduler] Asset scan client=${c.id} assets=${results.length} suggestions=${total}`);
    }
  } catch (err) {
    console.error("[ThreatScheduler] Asset scan failed:", err);
  }
}

export function start() {
  stop();
  kevInterval = setInterval(runKevSyncOnce, 24 * 60 * 60 * 1000);
  assetScanInterval = setInterval(runAssetScanOnce, 7 * 24 * 60 * 60 * 1000);
  console.log("[ThreatScheduler] Started");
}

export function stop() {
  if (kevInterval) {
    clearInterval(kevInterval);
    kevInterval = null;
  }
  if (assetScanInterval) {
    clearInterval(assetScanInterval);
    assetScanInterval = null;
  }
}
