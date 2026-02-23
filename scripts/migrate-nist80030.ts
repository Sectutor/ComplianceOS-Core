import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { sql } from 'drizzle-orm';

dotenv.config();
if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error("DATABASE_URL not found"); process.exit(1); }

const client = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

async function main() {
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nist_80030_threat_sources (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      type VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      capability VARCHAR(50),
      intent VARCHAR(50),
      targeting VARCHAR(50),
      motive VARCHAR(255),
      range_of_effects VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    console.log('Created nist_80030_threat_sources');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_n80030_ts_client_type ON nist_80030_threat_sources(client_id, type)`);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nist_80030_threat_events (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      threat_source_id INTEGER,
      event_id VARCHAR(50),
      name VARCHAR(500) NOT NULL,
      description TEXT,
      source_type VARCHAR(100),
      relevance VARCHAR(50),
      likelihood VARCHAR(50),
      vulnerabilities_predispositions TEXT,
      targeted_assets TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    console.log('Created nist_80030_threat_events');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_n80030_te_client ON nist_80030_threat_events(client_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_n80030_te_source ON nist_80030_threat_events(threat_source_id)`);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nist_80030_impact_assessments (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      domain VARCHAR(255) NOT NULL,
      cia_type VARCHAR(50),
      magnitude VARCHAR(50) NOT NULL,
      magnitude_score INTEGER DEFAULT 0,
      description TEXT,
      rationale TEXT,
      factor_name VARCHAR(255),
      factor_level VARCHAR(50),
      factor_type VARCHAR(50),
      factor_description TEXT,
      estimated_daily_impact INTEGER,
      revenue_loss_pct INTEGER,
      legal_fines_pct INTEGER,
      brand_equity_pct INTEGER,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    console.log('Created nist_80030_impact_assessments');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_n80030_ia_client_domain ON nist_80030_impact_assessments(client_id, domain)`);

    console.log('All NIST 800-30 tables created successfully!');
    await client.end();
    process.exit(0);
}

main().catch(e => { console.error(e); client.end(); process.exit(1); });
