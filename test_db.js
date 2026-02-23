import * as dotenv from 'dotenv';
dotenv.config({ path: './packages/core/.env' });
import { getDb } from './packages/core/src/db.ts';
import * as schema from './packages/core/src/schema.ts';

async function test() {
    const dbConn = await getDb();

    try {
        console.log('Testing dbConn.select().from(table).where(undefined)...');
        await dbConn.select().from(schema.federalPoams).where(undefined);
        console.log('where(undefined) OK');
    } catch (e) { console.error('ERROR:', e.message); }

    console.log('Done.');
    process.exit();
}
test();
