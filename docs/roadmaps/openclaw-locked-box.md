# Locked‑Box OpenClaw Security Copilot — Self‑Hosted Plan

## Vision
Build a self‑hosted, single‑tenant “locked box” Security Copilot that runs entirely in your environment. No SaaS, no external channels. Use OpenClaw for in‑house WebChat, plugins for every security capability, strict isolation, signed manifests, JSON‑validated I/O, and Premium UI slots; Core remains clean and open‑source.

## Visual Diagram
```
[Admin SSO/VPN]
        |
[Internal WebChat]
        |
+-----------------------------------+
| OpenClaw Gateway (Clawdbot)       |
|  - WebChat channel only           |
|  - Agents (Security Advisor)      |
|  - Tools, Canvas, Sessions        |
+-----------------------------------+
        | (localhost, HMAC)
        v
+-----------------------------------+
| Plugin Runtime (Sandboxed)        |
|  - Tools/Pipelines/Scanners       |
|  - Playbooks (SOAR)               |
+-----------------------------------+
        |
        v
+-----------------------------------+
| ComplianceOS Backend              |
|  - Advisor Router                 |
|  - LLMService (dynamic providers) |
|  - Evidence/Risk/Policy stores    |
|  - RAG Indexer + Citations        |
+-----------------------------------+
        |
        v
+-----------------------------------+
| ComplianceOS Frontend             |
|  - Premium slots bind AI          |
|  - Admin Console (locked box)     |
+-----------------------------------+
```

## Deployment Model
- Single‑tenant, self‑hosted. Services bind to localhost; WebChat behind SSO/VPN and reverse proxy.
- Operating modes:
  - Connected: limited outbound via egress proxy for Anthropic/OpenAI.
  - Air‑gapped: local models and scanners only; offline updates via signed bundles.

## Architecture
- Channels → OpenClaw Gateway (agents, sessions, tools, Canvas) → Plugins (tools/pipelines/scanners/playbooks/slots) → ComplianceOS APIs (advisor, evidence, risk, policy) → Responses with citations.
- App Touchpoints:
  - Slots registry (Core/Premium)
  - Advisor router endpoints
  - LLM service provider selection

## Security Baseline
- DM pairing + allowlists (WebChat only); doctor checks.
- HMAC signatures with nonces/timestamps; replay protection.
- RBAC in advisor endpoints (viewer blocked; owner/admin/editor allowed); full audit.
- Secrets via env/OS keyring; dynamic provider imports; JSON‑only outputs enforced.
- Network hardening: localhost bindings; firewall block external ports; optional mTLS.
- Data minimization, redaction pipelines, retention policies, immutable audit.

## Plugin‑First Design
- Extension points:
  - Tools: agent tools calling advisor endpoints or running jobs (sync/async).
  - Pipelines: ingestion/parsers/processors for logs/artifacts → ECS‑like normalized records + embeddings.
  - Scanners: SAST/DAST/CSPM/ASM/SBOM/Secrets runners with normalized JSON outputs.
  - UI Slots (Premium): React components registered to Policy/Risk/Controls.
  - Playbooks: declarative SOAR (triggers, actions, guards, approvals).
- SDK:
  - Manifest: name, version, scopes, extension points, input/output JSON schemas, budgets, supported channels.
  - Interfaces: ToolHandler, PipelineStage, ScannerRunner, SlotComponent, PlaybookDefinition.
  - Validation: JSON object outputs only; schema registry; golden tests.
  - Packaging: deterministic builds, SBOM, signed bundles; internal marketplace.
  - Isolation: per‑plugin sandbox (process/container); resource quotas; deny‑by‑default egress.

## Initial Plugin Catalog
- Pentesting: nuclei, Naabu/Nmap, Amass; PDF/HTML/MD parsers; CVSS scoring; dedupe.
- Logs/SIEM: syslog/Windows Event/OpenSearch; parsers; anomaly detection; Sigma rules.
- SOAR: isolate host, disable accounts, rotate keys, block IPs; human approvals.
- CSPM/IAM: Prowler, ScoutSuite, Terrascan; IAM hygiene (toxic combos/stale perms/shadow admins).
- SAST/DAST: Semgrep, CodeQL (optional), OWASP ZAP.
- SBOM/Supply Chain: CycloneDX/SPDX ingestion; OSV‑Scanner, Trivy; remediation tracking.
- ASM: subdomain/port discovery, tech fingerprinting, exposure correlation.
- DLP/Secrets: truffleHog, git‑secrets.
- IR: incident report parsers; timeline; ATT&CK kill chain; lessons learned.
- GRC/CCM/Policy‑as‑Code: framework mapping; OPA/Rego rules; continuous control monitoring; evidence automation.

## Implementation Steps
- Environment: Node ≥22; OpenClaw WebChat only; SSO/VPN reverse proxy; pairing/allowlists.
- Security: HMAC middleware, nonces/timestamps, RBAC enforcement, audit.
- SDK Skeleton: manifest schema, interfaces, JSON validators, SBOM/signing stubs, dev harness.
- Core Tools: askQuestion, implementationPlan, reindexContent payload { clientId, context.id, data } with JSON object response validation.
- Premium Slots: bind one Policy/Risk/Controls slot; Core remains clean.
- Example Plugin: Pentest Parser (file upload → findings/tasks/citations → reindexContent).
- Observability: traces/metrics; correlation IDs; alerts on signature/RBAC failures.
- Tests & Docs: end‑to‑end WebChat → tool → advisor → slot; JSON validation; audit checks.

## Acceptance Criteria
- WebChat “Create implementation plan for CIS control 5” returns validated JSON with citations and stores locally.
- “Draft Access Control section” inserts via Premium slot with audit trail.
- “Parse Q1 pentest report” produces normalized findings and tasks; “Reindex evidence” updates embeddings; answers include citations.
- All services run on localhost; outbound blocked unless explicitly allowed; plugins and updates are signed and auditable.

