# ComplianceOS: Strategic Differentiators

ComplianceOS is architected to exceed the capabilities of standard GRC platforms like Vanta by focusing on **AI Sovereignty**, **Advisor-First Operations**, and **Programmable Governance**.

## 1. AI Sovereignty & Multi-Provider Support

Unlike platforms locked into a single opaque LLM implementation, ComplianceOS provides a transparent, agnostic AI layer.

### Architecture
- **Multi-Model Router**: The system uses a dedicated `LLMService` that can route requests to different providers based on feature requirements, cost, or data sensitivity.
- **Supported Providers**:
  - **OpenAI**: GPT-4o, GPT-4-Turbo, GPT-3.5
  - **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
  - **Google**: Gemini Pro 1.5
  - **DeepSeek**: DeepSeek-V3
  - **Custom/Local**: Any OpenAI-compatible endpoint (e.g., vLLM, Ollama)

### Key Benefit: Cost & Privacy Control
Organizations can route high-volume, low-sensitivity tasks (like initial evidence classification) to cheaper models, while reserving high-intelligence models (like GPT-4) for complex risk analysis. Extremely sensitive data can be routed to private/local instances.

**Code Reference:** `packages/core/src/lib/llm/service.ts`

```typescript
// Priority-based routing allows failover and cost-optimization
private async getProviders(feature?: string): Promise<LLMProvider[]> {
    // 1. Try to find a specific rule for this feature (e.g. use Claude for drafting)
    // 2. Fallback to highest priority enabled provider
}
```

## 2. Advisor-First "White-Label" Architecture

ComplianceOS is uniquely built for **Managed Service Providers (MSPs)**, vCISOs, and Consultants who manage compliance for multiple clients.

### Capabilities
- **Advisor Workbench**: A "Command Center" view allowing advisors to triage evidence, monitor status, and deploy templates across dozens of client tenants from a single interface.
- **Deep Branding**: Complete white-labeling capabilities including custom portal titles, logos, and primary/secondary brand colors.
- **Template Deployment**: Advisors can maintain their own library of "Golden Standard" policies and controls and deploy them to client workspaces.

### Key Benefit: Resell Value
Advisors can deliver a branded, high-touch compliance experience that looks and feels like their own proprietary platform.

**Code Reference:** `packages/core/src/pages/AdvisorWorkbench.tsx`

```typescript
<PremiumSlot featureId="advisor_workbench" title="Advisor Workbench">
    {/* Multi-tenant triage and global template deployment */}
</PremiumSlot>
```

## 3. Programmable Governance Engine

We move beyond static checklists to a dynamic **State Machine Workflow Engine** that enforces compliance logic programmatically.

### Mechanics
- **Guards**: Logic that *prevents* invalid state transitions.
  - *Example*: "Cannot move Risk to 'Approved' without a Treatment Plan."
  - *Example*: "Cannot mark Control as 'Implemented' without verified Evidence."
- **Side Effects**: Automated actions triggered by state changes.
  - *Example*: "When Policy is 'Approved', auto-schedule a review in 12 months."
  - *Example*: "When Control fails, auto-create a Jira ticket."

### Key Benefit: Automated Enforcement
Compliance is enforced by the system code itself, reducing human error and ensuring that "Green" status actually means compliant.

**Code Reference:** `packages/core/src/lib/governance/workflow.ts`

```typescript
interface StateTransition {
    from: WorkflowStatus[];
    to: WorkflowStatus;
    guards?: TransitionGuard[];       // e.g. verify_evidence_exists
    sideEffects?: TransitionSideEffect[]; // e.g. create_jira_ticket
}
```
