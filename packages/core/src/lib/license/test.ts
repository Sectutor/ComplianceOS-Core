/**
 * Test script for license validation system
 * 
 * Run with: npx tsx src/lib/license/test.ts
 */

import { licenseValidator, FEATURES } from './index';

console.log('=== License Validation System Test ===\n');

// Test 1: Check license type
console.log('Test 1: License Type Detection');
console.log(`License Type: ${licenseValidator.getLicenseType()}`);
console.log(`Is Community: ${licenseValidator.isCommunityEdition()}`);
console.log(`Is Enterprise: ${licenseValidator.isEnterpriseEdition()}`);
console.log(`Is Trial: ${licenseValidator.isTrialEdition()}`);

// Test 2: Check feature availability
console.log('\nTest 2: Feature Availability');
const testFeatures = [
  FEATURES.AI_EVIDENCE_ANALYSIS,
  FEATURES.WHITE_LABEL_BRANDING,
  FEATURES.ENTERPRISE_SCALABILITY,
  FEATURES.SSO_SAML,
];

for (const feature of testFeatures) {
  const hasFeature = licenseValidator.hasFeature(feature);
  console.log(`${feature}: ${hasFeature ? '✓ Available' : '✗ Not Available'}`);
}

// Test 3: Validate multiple features
console.log('\nTest 3: Multiple Feature Validation');
const aiFeatures = [
  FEATURES.AI_EVIDENCE_ANALYSIS,
  FEATURES.AI_RISK_TRIAGE,
  FEATURES.AI_POLICY_DRAFTING,
];

const validationResult = licenseValidator.validateFeature(aiFeatures);
console.log(`All AI Features Available: ${validationResult.isValid ? '✓ Yes' : '✗ No'}`);
if (validationResult.missingFeatures && validationResult.missingFeatures.length > 0) {
  console.log(`Missing Features: ${validationResult.missingFeatures.join(', ')}`);
}

// Test 4: Get license info
console.log('\nTest 4: License Information');
const licenseInfo = licenseValidator.getLicenseInfo();
if (licenseInfo) {
  console.log(`Issued To: ${licenseInfo.issuedTo}`);
  console.log(`Status: ${licenseInfo.status}`);
  console.log(`Features Count: ${licenseInfo.features.length}`);
  if (licenseInfo.expiresAt) {
    console.log(`Expires: ${licenseInfo.expiresAt.toLocaleDateString()}`);
  }
}

// Test 5: Environment variables
console.log('\nTest 5: Environment Variables');
console.log(`VITE_ENABLE_PREMIUM: ${process.env.VITE_ENABLE_PREMIUM || 'not set'}`);
console.log(`VITE_LICENSE_KEY: ${process.env.VITE_LICENSE_KEY ? '*** set ***' : 'not set'}`);

console.log('\n=== Test Complete ===');
console.log('\nTo test different license types:');
console.log('1. Community Edition: Set VITE_ENABLE_PREMIUM=false or unset');
console.log('2. Enterprise Edition: Set VITE_ENABLE_PREMIUM=true and VITE_LICENSE_KEY=ENT-123456-7890-ABCD');
console.log('3. Trial Edition: Set VITE_ENABLE_PREMIUM=true without VITE_LICENSE_KEY');