# 📖 ComplianceOS Developer Manual: The White-Label Bible

**Version:** 1.0  
**Status:** Living Document  
**Audience:** All Developers (Core Team & Bespoke Integrators)

---

## 🏗️ 1. The Philosophy: "Core vs. Bespoke"

ComplianceOS is designed to be a **Multi-Tenant, White-Label Platform**. This means we deploy the same software for 100 different banks, hospitals, and startups, but each one might look different and have unique features.

### The Golden Rule
> **"Never modify `packages/core` to solve a problem for just one client."**

If Bank of America needs a "Treasury Risk" button, you do **NOT** add `if (client === 'BoA')` inside the Core components. Instead, you build a **Bespoke Module** and "plug it in".

### The Architecture
*   **🔵 Core (`packages/core`):** The immutable engine. Contains the Router, Auth, Standard Controls, and the "Slot System".
*   **🟢 Bespoke Modules (`packages/custom-*`):** Client-specific logic. Contains custom pages, logos, and unique database tables.
*   **🔌 Registry (`packages/core/src/registry`):** The "Switchboard" that connects the two.

---

## 🧩 2. The Slot & Registry Pattern

We use a "Slot" system to allow customization. Think of the Core UI as a motherboard with empty slots (PCIe), and Bespoke Modules as cards you plug in.

### Visualizing Slots

**The Core Audit Page (`AuditHub.tsx`):**
```tsx
<Header>
  <LogoSlot />           {/* 👈 Slot 1: Custom Logo */}
  <Title>Audit Hub</Title>
  <Actions>
     <ExportButton />
     <HeaderActionSlot /> {/* 👈 Slot 2: Custom Buttons (e.g. "Print to Fax") */}
  </Actions>
</Header>
```

If no module is plugged into `HeaderActionSlot`, it renders nothing. If the "BoA Module" is active, it renders their specific button.

---

## 🛠️ 3. Cookbook: How to Add Features

### Recipe 1: Changing the Logo & Branding (The Basics)
*Scenario: "Acme Corp" wants their logo and a red theme.*

1.  **Do not touch `App.tsx`.**
2.  Create a config file (or DB entry) for the client.
3.  The system automatically reads `client_config.logo_url` and injects it into the `LogoSlot`.

### Recipe 2: Adding a Custom Button (UI Injection)
*Scenario: A client wants a "Sync to Mainframe" button on the Controls page.*

1.  **Create the Component:**
    In `packages/custom-client/src/components/SyncButton.tsx`:
    ```tsx
    export const SyncButton = () => (
      <Button onClick={syncToMainframe}>Sync</Button>
    );
    ```

2.  **Register the Slot:**
    In `packages/custom-client/src/registry.ts`:
    ```typescript
    import { ControlActionSlot } from "@core/registry/slots";
    import { SyncButton } from "./components/SyncButton";

    ControlActionSlot.register(SyncButton);
    ```

### Recipe 3: Adding a Whole New Page (Module Injection)
*Scenario: A Hospital needs a "HIPAA Patient Logs" dashboard.*

1.  **Create the Page:**
    Build `packages/custom-hospital/src/pages/PatientLogs.tsx`.

2.  **Register the Route:**
    In `packages/custom-hospital/src/registry.ts`:
    ```typescript
    import { RouteRegistry } from "@core/registry/routes";
    import PatientLogs from "./pages/PatientLogs";

    RouteRegistry.add({
      path: "/hipaa-logs",
      component: PatientLogs,
      title: "Patient Logs",
      icon: "Stethoscope" // Lucide icon name
    });
    ```

3.  **Result:**
    The Core Sidebar automatically detects the new route and adds a "Patient Logs" menu item for that client only.

---

## 💾 4. Database Strategy

When building Bespoke features, you often need to store new data.

### Rule: Separation of Tables
*   **Core Tables:** `users`, `controls`, `evidence`. (Managed in `packages/core/src/schema.ts`)
*   **Bespoke Tables:** `patient_logs`, `treasury_risks`. (Managed in `packages/custom-hospital/src/schema.ts`)

### Migrations
The deployment pipeline runs migrations from **both** locations.
1.  `npm run db:migrate:core` (Updates standard tables)
2.  `npm run db:migrate:custom` (Updates client-specific tables)

This ensures that upgrading the Core (e.g., v1.0 -> v2.0) never breaks or deletes the client's custom data.

---

## 🚀 5. Deployment & Build

We use a "Distro" model.

*   **Standard Build:**
    `npm run build` -> Bundles Core only.
*   **Bespoke Build (e.g., for BoA):**
    `npm run build -- --with=packages/custom-bofa`

The build script aliases `@bespoke/registry` to the specific client package.

---

## ⚠️ 6. Dos and Don'ts

| ✅ DO | ❌ DON'T |
| :--- | :--- |
| Use `Slot.register()` to add UI. | Add `if (client == 'X')` in Core components. |
| Create new tables for custom data. | Add random columns to Core tables (e.g., `users.custom_field_1`). |
| Import Core types into Custom modules. | Import Custom modules into Core (Circular Dependency). |
| Keep Custom logic in its own folder. | Scatter Custom logic across the codebase. |

---

## 📚 7. Case Study: Refactoring Audit Hub (v1.0)
To demonstrate this pattern, we refactored the **AI Audit Analysis** feature in the Audit Hub.

### Before
The `AuditHub.tsx` file contained hardcoded logic for the AI button:
```tsx
// ❌ Hardcoded Dependency
import { analyzeMutation } from "@/trpc";
// ...
<Button onClick={analyzeMutation}>AI Audit Analysis</Button>
```

### After
1. We moved the AI logic to a standalone component: `packages/core/src/components/EvidenceAnalysisButton.tsx`.
2. We replaced the hardcoded button with a Slot in `AuditHub.tsx`:
```tsx
// ✅ Extensible Slot
<Slot 
  name={SlotNames.EVIDENCE_TOOLBAR_ACTIONS} 
  props={{ evidenceId: ... }} 
/>
```
3. We registered the default button in `packages/core/src/registry/defaults.tsx`.

**Result:** The Core `AuditHub` is now "clean". In the future, we can swap the simple AI Analysis for a "Premium Enterprise AI" module just by changing the registry, without editing the Audit Hub page itself.

## 📚 8. Case Study: Refactoring Controls Page (v1.1)
We also separated the **Premium AI Features** from the Controls Library.

### What we moved
1.  **Smart Link (AI Auto-Mapping):** The logic to automatically map controls between frameworks (e.g., ISO 27001 <-> SOC 2) was moved to `packages/core/src/components/controls/SmartLinkButton.tsx`.
2.  **Generate with AI:** The feature to auto-generate implementation guidance was moved to `packages/core/src/components/controls/GenerateGuidanceButton.tsx`.

### The Result
The `Controls.tsx` file is now purely a CRUD interface for controls. It has no knowledge of "AI" or "LLMs".
*   `SlotNames.CONTROL_HEADER_ACTIONS`: Injects the "Smart Link" button.
*   `SlotNames.CONTROL_EDIT_ACTIONS`: Injects the "Generate with AI" button.

This proves that **Core = Free/Open Source** (CRUD features) and **Premium = Paid** (AI Automation) can coexist in the same codebase without tangling.

## 📚 9. Case Study: Refactoring Policy Editor (v1.2)
We applied the same pattern to the **Policy Editor** to decouple AI suggestions from the core editing experience.

### What we moved
1.  **Risk Suggestions:** The "AI Suggest Risks" feature was extracted to `packages/core/src/components/policy/PolicyRiskSuggestion.tsx`.
2.  **Control Suggestions:** The "AI Suggest Controls" feature was extracted to `packages/core/src/components/policy/PolicyControlSuggestion.tsx`.

### The Result
The `PolicyEditor.tsx` no longer contains heuristic matching logic or AI state. It simply provides slots:
*   `SlotNames.POLICY_RISK_SUGGESTION`
*   `SlotNames.POLICY_CONTROL_SUGGESTION`

This allows us to potentially replace the simple keyword-based suggestion engine with a more advanced vector-search-based AI model in the future, purely by registering a different component.

## 📚 10. Case Study: Refactoring Risk Assessment (v1.3)
We continued the pattern by decoupling the **AI Control Suggestions** from the Risk Assessment Editor.

### What we moved
1.  **Risk Control Suggestions:** The "AI Suggest Controls based on Threat & Vulnerability" feature was decoupled from `RiskAssessmentEditor.tsx`.

### The Result
The `RiskAssessmentEditor.tsx` now uses the slot `SlotNames.RISK_CONTROL_SUGGESTION`.
This means:
*   **Standard Edition:** Can show a simple list or nothing.
*   **Premium Edition:** Can inject `AIControlSuggestions` (which uses LLMs to analyze threats).

2.  **Auto-Triage:** The "Auto-Triage with AI" button was also extracted to `packages/core/src/components/risk/RiskAutoTriageButton.tsx` and placed in the `SlotNames.RISK_AUTO_TRIAGE` slot.

3.  **Risk Reports:** The AI report generation buttons were extracted into `RiskReportAIButton.tsx` and `RiskReportGenerateAllButton.tsx`, using slots `RISK_REPORT_AI_BUTTON` and `RISK_REPORT_GENERATE_ALL`.

## 📚 11. Case Study: Refactoring Gap Analysis (v1.4)
Finally, we applied the pattern to the Gap Analysis module.

### What we moved
1.  **AI Remediation Assist:** The "AI Assist" button in the `GapAnalysisControlCard` was extracted to `packages/core/src/components/gap-analysis/GapAnalysisAIButton.tsx`.

### The Result
The `GapAnalysisControlCard.tsx` now uses `SlotNames.GAP_ANALYSIS_AI_BUTTON`.
This allows the Core OS to offer a clean gap analysis tool, while the Premium edition can inject an AI agent that writes remediation plans for you.

---

*ComplianceOS Engineering Team*
