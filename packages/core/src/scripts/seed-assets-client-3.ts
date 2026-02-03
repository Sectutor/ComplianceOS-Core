
import { getDb } from '../db';
import { assets } from '../schema';
import fs from 'fs';
import path from 'path';

// Load .env manually
try {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Looking for .env at', envPath);
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line, index) => {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      } else {
         if (line.trim()) console.log(`Line ${index} did not match:`, line);
      }
    });
    console.log('Loaded .env from root');
     console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
     if (process.env.DATABASE_URL) console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
   } else {
      console.warn('Could not find .env at', envPath);
  }
} catch (e) {
  console.error('Failed to load .env', e);
}

const VENDORS = ['Microsoft', 'Apple', 'Dell', 'Cisco', 'AWS', 'Google', 'Salesforce', 'Adobe', 'Oracle', 'Slack', 'Zoom', 'Atlassian', 'Lenovo', 'HP'];
const LOCATIONS = ['HQ - New York', 'Remote - US', 'Branch - London', 'Data Center - Virginia', 'Cloud - AWS us-east-1'];
const DEPARTMENTS = ['IT', 'Engineering', 'HR', 'Finance', 'Sales', 'Marketing', 'Legal', 'Operations'];
const OWNERS = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Charlie Brown'];

const ASSET_TYPES = [
  { type: 'Hardware', weight: 20, prefixes: ['MacBook Pro', 'Dell XPS', 'Cisco Switch', 'HP Server', 'iPhone 13'] },
  { type: 'Software', weight: 30, prefixes: ['Windows 11', 'Office 365', 'Salesforce CRM', 'Jira', 'Slack', 'Adobe Creative Cloud', 'Visual Studio Code'] },
  { type: 'Information', weight: 15, prefixes: ['Customer Database', 'Employee Records', 'Source Code', 'Financial Reports', 'Strategic Plan'] },
  { type: 'People', weight: 10, prefixes: ['CTO', 'CISO', 'Lead Developer', 'HR Manager', 'Sales Director'] },
  { type: 'Service', weight: 15, prefixes: ['AWS Hosting', 'Azure AD', 'GitHub Actions', 'Stripe Payments', 'Intercom'] },
  { type: 'Reputation', weight: 10, prefixes: ['Company Brand', 'Twitter Account', 'LinkedIn Page', 'Glassdoor Reviews'] }
];

function randomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('Starting seed for Client 3...');
  const db = await getDb();
  const clientId = 3;
  
  const generatedAssets = [];

  for (let i = 0; i < 100; i++) {
    // Select type based on weight (simplified: just random loop through types or flat distribution, but let's try to honor weights)
    // Actually, just looping 100 times and picking a random type definition is fine for demo
    const typeDef = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
    
    const name = `${randomItem(typeDef.prefixes)} - ${randomInt(1000, 9999)}`;
    const vendor = typeDef.type === 'Software' || typeDef.type === 'Hardware' ? randomItem(VENDORS) : null;
    const productName = vendor ? name.split(' - ')[0] : null;
    const version = typeDef.type === 'Software' ? `v${randomInt(1, 15)}.${randomInt(0, 9)}` : null;
    
    const technologies = [];
    if (typeDef.type === 'Software') {
       if (Math.random() > 0.5) technologies.push('Cloud');
       if (Math.random() > 0.5) technologies.push('SaaS');
       if (Math.random() > 0.5) technologies.push('On-Premise');
    }

    generatedAssets.push({
      clientId,
      name,
      type: typeDef.type,
      owner: randomItem(OWNERS),
      vendor,
      productName,
      version,
      technologies: technologies.length > 0 ? technologies : null,
      valuationC: randomInt(1, 5),
      valuationI: randomInt(1, 5),
      valuationA: randomInt(1, 5),
      description: `Auto-generated demo asset of type ${typeDef.type}`,
      location: randomItem(LOCATIONS),
      department: randomItem(DEPARTMENTS),
      status: 'active' as const,
      acquisitionDate: new Date(),
    });
  }

  // Batch insert
  // Drizzle insert many
  try {
      // Chunking just in case, though 100 is small
      await db.insert(assets).values(generatedAssets);
      console.log('Successfully inserted 100 assets for Client 3');
  } catch (error) {
      console.error('Error seeding assets:', error);
  }
}

seed().catch(console.error).finally(() => process.exit());
