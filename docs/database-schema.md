# Database Schema

ComplianceOS uses PostgreSQL with Drizzle ORM. The schema is defined in `schema.ts`.

## Core Modules

### Users & Clients
-   **`users`**: System users (login, profile, role).
-   **`clients`**: Tenant organizations.
-   **`user_clients`**: Many-to-many relationship linking users to clients with specific roles.
-   **`employees`**: Internal staff directory for the client (separate from system users).

### Policies & Controls
-   **`controls`**: Master library of controls (ISO 27001, SOC 2, etc.).
-   **`client_controls`**: Instance of a control for a specific client (implementation status, owner).
-   **`policies`**: Master policy templates.
-   **`client_policies`**: Client-specific policies (versioned, content).
-   **`evidence`**: Evidence collected for controls.
-   **`control_policy_mappings`**: Links between controls and policies.

## Risk Management
-   **`assets`**: Inventory of assets (hardware, software, data).
-   **`risk_scenarios`**: Risk register (threats + vulnerabilities).
-   **`risk_assessments`**: Periodic assessments of risks.
-   **`risk_treatments`**: Plans to mitigate risks.
-   **`vulnerabilities`** & **`threats`**: Libraries of potential issues (CVEs, etc.).

## Business Continuity (BCMS)
-   **`business_processes`**: Critical business functions.
-   **`business_impact_analyses` (BIA)**: Analysis of disruption impact.
-   **`bc_plans`**: Recovery plans.
-   **`bc_strategies`**: Strategies for continuity (e.g., redundant site).
-   **`disruptive_scenarios`**: Scenarios for testing plans.

## Vendor Risk (TPRM)
-   **`vendors`**: Third-party vendors.
-   **`vendor_assessments`**: Security reviews of vendors.
-   **`vendor_contracts`**: Contract management.

## AI & RAG
-   **`embeddings`**: Vector storage for documents (pgvector).
-   **`knowledge_articles`**: RAG source material.
-   **`tech_suggestions`**: AI-generated technology recommendations.
-   **`advisor_conversations`**: Chat history with the AI Advisor.

## Governance & Workflow
-   **`work_items`**: Unified task queue (approvals, reviews).
-   **`tasks`**: Generic tasks.
-   **`audit_logs`**: System-wide audit trail.
-   **`notifications`**: User notification preferences and logs.

## Federal / NIST
-   **`federal_ssps`**: System Security Plans.
-   **`federal_poams`**: Plan of Action and Milestones.
-   **`fips_categorizations`**: FIPS 199 impact levels.
