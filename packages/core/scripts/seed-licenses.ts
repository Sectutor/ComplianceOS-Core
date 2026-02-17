/**
 * Seed script for creating sample license data
 * 
 * Run with: npx tsx packages/core/scripts/seed-licenses.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env and .env.local from project root
const projectRoot = resolve(process.cwd(), '../..');
config({ path: resolve(projectRoot, '.env') });
config({ path: resolve(projectRoot, '.env.local'), override: true });

import { LicenseDbService } from '../src/lib/license/licenseDbService';
import { getDb } from '../src/db';
import { licenseActivations } from '../src/schema/licenses';
import { eq } from 'drizzle-orm';

async function seedLicenses() {
  console.log('Starting license seed...');
  
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }
  
  const licenseService = new LicenseDbService();
  
  // Clear existing test licenses (optional)
  await db.delete(licenseActivations).where(
    eq(licenseActivations.licenseKey, 'TEST-30-DAYS') 
    || eq(licenseActivations.licenseKey, 'TEST-7-DAYS')
    || eq(licenseActivations.licenseKey, 'TEST-1-DAY')
    || eq(licenseActivations.licenseKey, 'TEST-EXPIRED')
  );
  
  console.log('Creating test licenses...');
  
  const now = new Date();
  
  // License expiring in 30 days
  const license30Days = await licenseService.createLicenseActivation({
    licenseKey: 'TEST-30-DAYS',
    licenseType: 'enterprise',
    licenseStatus: 'active',
    productName: 'ComplianceOS Enterprise',
    customerEmail: 'client30@example.com',
    customerName: '30-Day Test Client',
    clientId: 1001,
    maxUsers: 50,
    maxClients: 10,
    issuedAt: now,
    activatedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    enabledFeatures: ['ai.evidence_analysis', 'advisor.workbench', 'enterprise.scalability'],
    metadata: {
      test: true,
      reminderType: '30_days'
    }
  });
  
  console.log(`Created 30-day license: ${license30Days.licenseKey}`);
  
  // License expiring in 7 days
  const license7Days = await licenseService.createLicenseActivation({
    licenseKey: 'TEST-7-DAYS',
    licenseType: 'enterprise',
    licenseStatus: 'active',
    productName: 'ComplianceOS Enterprise',
    customerEmail: 'client7@example.com',
    customerName: '7-Day Test Client',
    clientId: 1002,
    maxUsers: 25,
    maxClients: 5,
    issuedAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000), // issued 23 days ago
    activatedAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    enabledFeatures: ['ai.evidence_analysis', 'advisor.workbench'],
    metadata: {
      test: true,
      reminderType: '7_days'
    }
  });
  
  console.log(`Created 7-day license: ${license7Days.licenseKey}`);
  
  // License expiring in 1 day
  const license1Day = await licenseService.createLicenseActivation({
    licenseKey: 'TEST-1-DAY',
    licenseType: 'trial',
    licenseStatus: 'active',
    productName: 'ComplianceOS Trial',
    customerEmail: 'client1@example.com',
    customerName: '1-Day Test Client',
    clientId: 1003,
    maxUsers: 10,
    maxClients: 1,
    issuedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), // issued 29 days ago
    activatedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    enabledFeatures: ['ai.evidence_analysis'],
    metadata: {
      test: true,
      reminderType: '1_day'
    }
  });
  
  console.log(`Created 1-day license: ${license1Day.licenseKey}`);
  
  // Already expired license (1 day ago)
  const licenseExpired = await licenseService.createLicenseActivation({
    licenseKey: 'TEST-EXPIRED',
    licenseType: 'enterprise',
    licenseStatus: 'expired',
    productName: 'ComplianceOS Enterprise',
    customerEmail: 'expired@example.com',
    customerName: 'Expired Test Client',
    clientId: 1004,
    maxUsers: 100,
    maxClients: 20,
    issuedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // issued 1 year ago
    activatedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // expired 1 day ago
    enabledFeatures: ['ai.evidence_analysis', 'advisor.workbench', 'enterprise.scalability', 'security.sso_saml'],
    metadata: {
      test: true,
      expired: true
    }
  });
  
  console.log(`Created expired license: ${licenseExpired.licenseKey}`);
  
  console.log('✅ License seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- 30-day license: ${license30Days.licenseKey} (expires: ${license30Days.expiresAt})`);
  console.log(`- 7-day license: ${license7Days.licenseKey} (expires: ${license7Days.expiresAt})`);
  console.log(`- 1-day license: ${license1Day.licenseKey} (expires: ${license1Day.expiresAt})`);
  console.log(`- Expired license: ${licenseExpired.licenseKey} (expired: ${licenseExpired.expiresAt})`);
  console.log('\n📧 The license renewal scheduler will now send reminders for these licenses.');
  console.log('   Check the server logs for email simulation messages.');
}

// Run the seed
seedLicenses()
  .then(() => {
    console.log('\n✨ Seed script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });