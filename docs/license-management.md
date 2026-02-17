# ComplianceOS License Management System

## Overview

A comprehensive dual-licensing system for ComplianceOS that enables:
- **Community Edition (Open Core)** - Free, open source build. Verified by `VITE_ENABLE_PREMIUM=false` to globally disable enterprise features.
- **Enterprise Edition** - Full-featured commercial build. Requires a valid license key to unlock premium modules.
- **Trial Edition** - Time-limited evaluation of enterprise features.

## Architecture

### 1. Dual-Licensing Build System
- **Strict Enforcement**: The environment variable `VITE_ENABLE_PREMIUM` is the single source of truth. 
  - If set to `'false'`, **ALL** premium features are disabled at the API and UI level, regardless of user role.
  - If set to `'true'`, features are gated by the client's subscription tier in the database.
- **Open Core Model**: Core compliance features are always available. Advanced modules (Federal, AI, etc.) are "graduated" to Core over time.

### 2. Database Schema
Located at `packages/core/src/schema/licenses.ts`:
- `license_activations` - Store license keys, expiration dates, customer info
- `license_validation_logs` - Audit trail of license validation attempts
- `license_feature_usage` - Track usage of licensed features
- `gumroad_webhook_events` - Store Gumroad webhook events for automated activation
- `license_configurations` - Configuration for license management

### 3. License Validation & Activation
- **Frontend**: [ClientLicenseActivation.tsx](file:///D:/OneDrive%20-%20Intellfence/WebDev/ComplianceOS/packages/core/src/pages/ClientLicenseActivation.tsx) - How users input their key.
- **Backend**: [gumroad.ts](file:///D:/OneDrive%20-%20Intellfence/WebDev/ComplianceOS/packages/core/src/server/routers/gumroad.ts) - Handles validation logic.
  - **Automatic Upgrades**: Successfully activating a license automatically upgrades the client's `planTier` to `enterprise` (or `pro`) and sets `subscriptionStatus` to `active`.
  - **Automatic Downgrades**: Deactivating a license immediately reverts the client to the `free` tier.
- **Database Service**: [licenseDbService.ts](file:///D:/OneDrive%20-%20Intellfence/WebDev/ComplianceOS/packages/core/src/lib/license/licenseDbService.ts) - CRUD operations

### 4. Automated Renewal Reminder System
- **Scheduler**: [licenseRenewalScheduler.ts](file:///D:/OneDrive%20-%20Intellfence/WebDev/ComplianceOS/packages/core/src/server/services/licenseRenewalScheduler.ts) - Runs hourly, checks for expiring licenses
- **Email Templates**: 
  - `renewalReminder.ts` - 30, 7, and 1-day reminders to customers
  - `adminNotification.ts` - Notifications to admin about expiring/expired licenses
- **Email Service**: Uses existing EmailService (SendGrid/SMTP simulation)

### 5. Analytics & Reporting Dashboard
- [LicenseAnalytics.tsx](file:///D:/OneDrive%20-%20Intellfence/WebDev/ComplianceOS/packages/core/src/pages/admin/LicenseAnalytics.tsx) - Comprehensive dashboard with charts
- Revenue tracking, renewal forecasting, license distribution
- Date range filtering and data export

## Key Features

### Feature Flag System (`packages/core/src/lib/features/index.tsx`)
```typescript
// 40+ features organized by category:
// - Community (AGPLv3): basic.dashboard, reports.simple
// - AI: ai.evidence_analysis, ai.risk_triage
// - Enterprise: enterprise.scalability, security.sso_saml
// - Deployment: deployment.on_premises, deployment.air_gapped
```

### License Types & Validation
```typescript
// License types: 'community', 'trial', 'enterprise'
// Validation against Gumroad API with local caching
// Grace period support for expired licenses
```

### Renewal Reminder Logic
- **30 days before expiry**: First reminder
- **7 days before expiry**: Urgent reminder
- **1 day before expiry**: Final reminder
- **Day after expiry**: Admin notification

## Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...

# Email Configuration (optional - simulation used if not set)
SENDGRID_API_KEY=your_sendgrid_key
# OR
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# License Management
ENABLE_LICENSE_RENEWAL_SCHEDULER=true
ADMIN_EMAIL=admin@complianceos.com
BUILD_TYPE=AGPLv3 # or COMMERCIAL, TRIAL
```

### Database Migration
```bash
# Apply license schema migrations
npm run db:push
```

## Usage

### 1. Client License Activation
1. Navigate to `/client/license-activation`
2. Enter Gumroad license key
3. System validates against Gumroad API
4. License is activated and features unlocked

### 2. Admin Analytics Dashboard
1. Navigate to `/admin/licenses/analytics`
2. View license metrics, renewals, revenue
3. Manage expiring licenses
4. Export reports

### 3. Testing with Sample Data
```bash
# Create test licenses (30, 7, 1-day expiry, expired)
npx tsx packages/core/scripts/seed-licenses.ts
```

### 4. Monitoring Renewal Scheduler
Check server logs for scheduler activity:
```bash
[LicenseRenewal] Starting renewal check...
[RenewalReminder] Would send 30_days reminder...
[LicenseRenewal] Sent 6 renewal reminders (0 errors)
```

## API Endpoints

### tRPC Procedures (`packages/core/src/server/routers/gumroad.ts`)
- `gumroad.validateLicense` - Validate license key (read-only check)
- `gumroad.activateLicense` - Activates key and **upgrades client tier**
- `gumroad.deactivateLicense` - Deactivates key and **downgrades client to free**
- `gumroad.getLicenseAnalytics` - Get analytics data
- `gumroad.getExpiringLicenses` - Get licenses expiring soon

## Email Integration

The system uses the existing EmailService (`packages/core/src/lib/email/service.ts`):
- **SendGrid**: If `SENDGRID_API_KEY` is set
- **SMTP**: If SMTP configuration is provided
- **Simulation**: Logs emails if no email service configured (development)

Email templates support:
- HTML and plain text versions
- Dynamic variables (customer name, expiry date, renewal link)
- Branding consistent with ComplianceOS

## Security Considerations

1. **License Validation**: All validations logged for audit trail
2. **API Keys**: Gumroad API keys stored server-side only
3. **Rate Limiting**: Built-in rate limiting for validation attempts
4. **Data Encryption**: Sensitive customer data encrypted at rest
5. **Access Control**: Admin endpoints protected by role-based access

## Testing

### Test License Keys
- `TEST-30-DAYS` - Expires in 30 days (enterprise)
- `TEST-7-DAYS` - Expires in 7 days (enterprise)
- `TEST-1-DAY` - Expires in 1 day (trial)
- `TEST-EXPIRED` - Already expired (enterprise)

### Integration Tests
1. License validation with Gumroad mock
2. Renewal scheduler with test licenses
3. Email delivery simulation
4. Feature flag enforcement

## Deployment

### Production Checklist
- [ ] Set `VITE_ENABLE_PREMIUM=true` to enable Enterprise feature gating
- [ ] Configure email service (SendGrid/SMTP)
- [ ] Set `ADMIN_EMAIL` for notifications
- [ ] Enable `ENABLE_LICENSE_RENEWAL_SCHEDULER=true`
- [ ] Run database migrations
- [ ] Test license activation flow
- [ ] Monitor scheduler logs

### On-Premises Deployment
For on-premises customers:
1. Build with `BUILD_TYPE=COMMERCIAL`
2. Provide license keys via Gumroad
3. Customers activate via self-service portal
4. Renewal reminders sent automatically
5. Usage analytics available to admin

## Monitoring & Maintenance

### Key Metrics to Monitor
- License activation success rate
- Renewal reminder delivery rate
- Feature usage patterns
- Revenue from license renewals
- Scheduler execution frequency

### Troubleshooting
1. **License validation failing**: Check Gumroad API connectivity
2. **Emails not sending**: Verify email service configuration
3. **Scheduler not running**: Check `ENABLE_LICENSE_RENEWAL_SCHEDULER`
4. **Analytics not loading**: Verify database connection

## Support

For issues with the license management system:
1. Check server logs for error messages
2. Verify environment variables are set
3. Test database connectivity
4. Review Gumroad webhook configuration

---

*Last Updated: 2026-02-16*
*System Version: 1.0.0*