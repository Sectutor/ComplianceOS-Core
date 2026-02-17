# Feature Graduation Policy

## 🎓 Overview
ComplianceOS operates on an **Open Core** model with a unique twist: **Feature Graduation**. 

Instead of permanently locking advanced features behind a paywall, we view the "Premium" tier as an "Early Access" or "Sponsor" tier. Features often start as Premium to fund their initial development and then "graduate" to the Community (open source) edition after a stabilization period.

This ensures that the open source version of ComplianceOS becomes more powerful over time, while sustainable revenue funds continuous innovation.

## 🕰️ Graduation Timeline
Features typically follow this lifecycle:

1.  **Development**: Built and tested internally.
2.  **Premium Release**: Released to Enterprise/Pro customers. 
    *   *Duration*: 3-6 months.
    *   *Goal*: Gather feedback, fix bugs, recover development costs.
3.  **Evaluation**: Core team reviews feature stability and adoption.
4.  **Graduation**: Feature is moved to the Community (Core) edition.

## 🛠️ How to Graduate a Feature

When a feature (e.g., "Federal Compliance") is selected for graduation, follow these steps:

### 1. Backend Un-gating
Backend procedures are protected by `premiumProcedure` or explicit middleware.
*   **Locate Router**: Go to `packages/core/src/server/routers/[feature].ts`.
*   **Replace Procedure Type**: Change `premiumProcedure` (or `clientProcedure.use(checkPremiumAccess)`) to standard `clientProcedure`.
    *   *Before*: `getFipsCategorization: premiumProcedure...`
    *   *After*: `getFipsCategorization: clientProcedure...`

### 2. Frontend Un-gating
Frontend routes and UI elements are protected by `UnifiedClientGuard` or `useLicense` hooks.
*   **Update Routes**: In `App.tsx`, remove the `<UnifiedClientGuard requirePremium>` wrapper from relevant routes.
*   **Update Navigation**: In `DashboardLayout.tsx` or similar, remove conditional rendering checks (e.g., `if (isPremium) ...`).

### 3. Verification
*   Run the application in Community mode (`VITE_ENABLE_PREMIUM=false`).
*   Verify the feature is accessible and functional without a license key.

### 4. Announcement
*   Update `README.md` to move the feature from "Enterprise" to "Community" column.
*   Announce in Release Notes that the feature is now available to everyone.

## 🚫 What NEVER Graduates?
Some features are permanently Enterprise-only due to their nature:
*   **MSP/Multi-Tenancy**: Features designed for service providers reselling ComplianceOS.
*   **AI Service Costs**: Features that incur direct per-usage costs (like LLM tokens) unless the user brings their own API key.
*   **SLA/Support**: Human support is always a paid service.
