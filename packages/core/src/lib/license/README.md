# License Validation System

## Overview

This system implements license validation for ComplianceOS's dual-licensing model:
- **Community Edition**: AGPLv3, free and open source
- **Enterprise Edition**: Commercial license with premium features
- **Trial Edition**: Limited-time trial with some premium features

## Architecture

### Core Components

1. **License Validator** (`index.ts`)
   - Singleton class for license validation
   - Feature-based access control
   - License type detection (community/enterprise/trial)
   - Caching for performance

2. **License Server Client** (`server.ts`)
   - Communication with license server
   - License activation/validation/deactivation
   - Mock server for development
   - Caching and error handling

3. **React Components**
   - `PremiumSlotEnhanced`: Enhanced premium slot with license checks
   - `LicenseProtectedButton`: Buttons with license protection
   - `UpgradePrompt`: Upgrade prompts and modals
   - `LicenseManagement`: License management page

## Usage Examples

### 1. Basic License Check

```typescript
import { useLicense, FEATURES } from '@/lib/license';

function MyComponent() {
  const { hasFeature, isEnterpriseEdition } = useLicense();
  
  if (!hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS)) {
    return <UpgradePrompt featureId="ai.evidence_analysis" />;
  }
  
  return <AIFeature />;
}
```

### 2. Protected Button

```typescript
import { LicenseProtectedButton } from '@/components/license/LicenseProtectedButton';
import { FEATURES } from '@/lib/license';

function MyComponent() {
  return (
    <LicenseProtectedButton
      feature={FEATURES.AI_EVIDENCE_ANALYSIS}
      onClick={() => analyzeEvidence()}
    >
      Analyze with AI
    </LicenseProtectedButton>
  );
}
```

### 3. Premium Slot with License Check

```typescript
import { PremiumSlotEnhanced } from '@/components/PremiumSlotEnhanced';
import { FEATURES } from '@/lib/license';

function MyComponent() {
  return (
    <PremiumSlotEnhanced
      featureId="ai.evidence_analysis"
      title="AI Evidence Analysis"
      description="Use AI to analyze evidence for compliance"
      requiredFeatures={FEATURES.AI_EVIDENCE_ANALYSIS}
    >
      <EvidenceAnalysisComponent />
    </PremiumSlotEnhanced>
  );
}
```

### 4. HOC for License Protection

```typescript
import { withLicenseProtection } from '@/components/license/LicenseProtectedButton';
import { FEATURES } from '@/lib/license';

const ProtectedAIFeature = withLicenseProtection(
  AIFeatureComponent,
  FEATURES.AI_EVIDENCE_ANALYSIS
);
```

## Feature Definitions

Features are defined in `FEATURES` constant:

```typescript
export const FEATURES = {
  // AI Features
  AI_EVIDENCE_ANALYSIS: 'ai.evidence_analysis',
  AI_RISK_TRIAGE: 'ai.risk_triage',
  AI_POLICY_DRAFTING: 'ai.policy_drafting',
  // ... more features
} as const;
```

## License Types

### Community Edition (AGPLv3)
- No premium features
- Free and open source
- Self-hosted only
- No license key required

### Enterprise Edition (Commercial)
- All premium features
- Requires license key
- Commercial use rights
- Professional support

### Trial Edition
- Limited premium features
- Time-limited (typically 30 days)
- Requires license key
- Upgrade prompt shown

## Environment Configuration

### Development
```bash
# Community edition (default)
VITE_ENABLE_PREMIUM=false

# Enterprise edition (with mock license)
VITE_ENABLE_PREMIUM=true
VITE_LICENSE_KEY=ENT-123456-7890-ABCD
```

### Production
```bash
# Community edition
VITE_ENABLE_PREMIUM=false

# Enterprise edition (real license)
VITE_ENABLE_PREMIUM=true
VITE_LICENSE_KEY=<customer-license-key>
VITE_LICENSE_SERVER=https://license.complianceos.com
```

## Server Integration

### Real License Server
```typescript
import { getLicenseServerClient } from '@/lib/license/server';

const client = getLicenseServerClient({
  endpoint: 'https://license.complianceos.com',
  apiKey: 'your-api-key'
});

// Activate license
const result = await client.activateLicense({
  licenseKey: 'customer-license-key',
  domain: 'customer-domain.com'
});
```

### Mock Server (Development)
```typescript
import { getMockLicenseServerClient } from '@/lib/license/server';

const mockClient = getMockLicenseServerClient();

// Use mock licenses:
// - ENT-123456-7890-ABCD (enterprise)
// - TRIAL-123456-7890 (trial)
// - EXPIRED-123456-7890 (expired)
```

## Adding New Premium Features

1. **Define the feature** in `FEATURES` constant
2. **Update license validation** to include the feature
3. **Create feature-specific components** (optional)
4. **Add to documentation**

Example:
```typescript
// 1. Define feature
export const FEATURES = {
  // ... existing features
  NEW_AI_FEATURE: 'ai.new_feature',
};

// 2. Update license validator (optional - features are checked dynamically)

// 3. Create component
export const NewAIFeature = () => {
  const { hasFeature } = useLicense();
  
  if (!hasFeature(FEATURES.NEW_AI_FEATURE)) {
    return (
      <PremiumSlotEnhanced
        featureId="ai.new_feature"
        title="New AI Feature"
        description="Description of new feature"
      />
    );
  }
  
  return <Implementation />;
};
```

## Testing

### Unit Tests
```typescript
// Test license validation
test('community edition has no premium features', () => {
  const validator = new LicenseValidator();
  expect(validator.isCommunityEdition()).toBe(true);
  expect(validator.hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS)).toBe(false);
});
```

### Integration Tests
```typescript
// Test license server integration
test('activate valid license', async () => {
  const client = getMockLicenseServerClient();
  const result = await client.activateLicense({
    licenseKey: 'ENT-123456-7890-ABCD'
  });
  expect(result.success).toBe(true);
  expect(result.license?.type).toBe('enterprise');
});
```

## Security Considerations

1. **License keys should be kept secret**
2. **Validate licenses server-side for critical features**
3. **Implement rate limiting for license validation**
4. **Use HTTPS for license server communication**
5. **Cache license validation results appropriately**

## Deployment

### Self-hosted Community Edition
- No license server required
- All features are community features
- AGPLv3 license applies

### Enterprise Edition
- Requires license server
- License keys bound to domains
- Regular validation with server
- Grace period for offline use

## Troubleshooting

### Common Issues

1. **"License not found" error**
   - Check `VITE_LICENSE_KEY` environment variable
   - Verify license server connectivity
   - Check domain binding

2. **Features not showing**
   - Verify license type (community/enterprise/trial)
   - Check feature definitions
   - Clear license cache

3. **License validation errors**
   - Check network connectivity
   - Verify license server URL
   - Check API keys and permissions

### Debugging
```typescript
// Enable debug logging
console.log('[License] Current license:', licenseValidator.getLicenseInfo());
console.log('[License] Has AI feature:', licenseValidator.hasFeature(FEATURES.AI_EVIDENCE_ANALYSIS));
```

## Migration from Old System

The old system used `VITE_ENABLE_PREMIUM` environment variable. The new system:

1. **Backward compatible**: Old env var still works
2. **Enhanced features**: Feature-based access control
3. **Better UX**: Improved upgrade prompts
4. **Server integration**: Real license validation

To migrate:
1. Update `main.tsx` to use new license validator
2. Replace `PremiumSlot` with `PremiumSlotEnhanced`
3. Add license checks to premium features
4. Deploy license server for enterprise customers