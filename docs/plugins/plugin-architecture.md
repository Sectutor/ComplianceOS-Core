# Plugin Architecture and SDK (Standalone Locked‑Box)

## Goals
- Enable internal and third‑party teams to build auditable plugins that extend detection, response, compliance, and engineering.
- Guarantee isolation, explicit permissions, signed manifests, deterministic builds, and JSON‑validated I/O.

## Extension Points
- Tools: agent tool handlers calling advisor endpoints or executing jobs (sync/async).
- Pipelines: ingestion/parsers/processors (logs/artifacts) → ECS‑like normalized records + embeddings.
- Scanners: SAST/DAST/CSPM/ASM/SBOM/Secrets runners with normalized JSON outputs.
- UI Slots (Premium): React components registered to Policy/Risk/Controls.
- Playbooks: declarative SOAR workflows with triggers/actions/guards/approvals.

## SDK Components
- Manifest (manifest.json or TS):
  - name, version, description, author
  - scopes: read:logs, write:tasks, run:scanner:zap, ingest:aws/cloudwatch, slot:policy, etc.
  - extensionPoints: { tools[], pipelines[], scanners[], slots[], playbooks[] }
  - ioSchemas: JSON input/output schemas (objects only), example payloads
  - budgets: cpu/mem/time limits; network egress policy (deny‑by‑default)
- Interfaces (TypeScript):
  - ToolHandler
  - PipelineStage (source → parser → processor)
  - ScannerRunner
  - SlotComponent (React)
  - PlaybookDefinition
- Validation:
  - JSON object outputs only; enforced via schema registry
  - Golden test cases for request/response and failure modes
- Packaging:
  - Deterministic builds; lockfiles and SBOM generation
  - Signed bundles; internal marketplace publish/revoke
- Isolation:
  - Per‑plugin sandbox (process/container) with resource quotas
  - No shared mutable state; strict egress rules

## Development Harness
- Simulates Internal WebChat → tool → advisor → slot with test tenants.
- Produces traces/metrics; supports replay and contract tests.

## Security Controls
- HMAC signatures + nonces/timestamps on tool/webhook calls; replay protection
- RBAC enforcement in advisor endpoints; comprehensive audit logs
- Secrets via env/OS keyring; never persisted in logs; redaction pipelines
- Tenant isolation in DB/vector/object stores; retention policies; legal hold

## Publishing Flow
1) Scaffold plugin (CLI)
2) Implement interfaces and manifest scopes
3) Write JSON schemas and golden tests
4) Generate SBOM and sign bundle
5) Submit to internal marketplace; automated policy checks
6) Admin approves; plugin enabled for the single tenant

## Example Plugin Types
- Pentest Parser: file intake → findings/tasks/citations → reindexContent
- Log Ingestion: syslog/WinEvent/OpenSearch → ECS records → Sigma detections
- Scanner: OWASP ZAP/Semgrep/Trivy/OSV → normalized findings
- Playbook: isolate host/disable account/rotate keys/block IPs → approvals
- UI Slot: policy linter/rewriter; risk triage; control guidance

