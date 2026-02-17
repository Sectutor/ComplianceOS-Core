import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';

async function addCriteriaNotesColumn() {
  const db = await getDb();
  try {
    await db.execute(sql`ALTER TABLE samm_stream_assessments ADD COLUMN IF NOT EXISTS criteria_notes jsonb DEFAULT '{}'::jsonb`);
    console.log('✓ Added criteria_notes column to samm_stream_assessments');
  } catch (e: any) {
    console.error('Failed to add criteria_notes column:', e.message);
    throw e;
  }
}

addCriteriaNotesColumn()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
