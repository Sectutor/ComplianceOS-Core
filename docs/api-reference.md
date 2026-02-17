# API Reference

ComplianceOS uses a hybrid API approach:
1.  **tRPC:** For the majority of client-server communication (type-safe, efficient).
2.  **REST:** For specific use cases like file uploads, webhooks, and generated exports.

## Authentication
All API requests (except webhooks) require authentication.
-   **Session Cookie:** Used by the browser for tRPC and REST calls.
-   **Authorization Header:** Can be used for specific endpoints (Bearer Token).

## REST Endpoints

### File Uploads
**POST** `/api/upload-evidence-file`
Uploads an evidence file and triggers AI extraction.
-   **Body (JSON):**
    -   `filename`: string
    -   `data`: string (Base64 encoded)
    -   `contentType`: string
    -   `clientId`: number
    -   `controlId`: number (optional)
-   **Response:** `{ key: string, url: string }`

### Exports
**GET** `/api/export/soa/:clientId`
Download the Statement of Applicability (SoA) as a DOCX file.

**GET** `/api/export/policy/:id/docx`
Download a policy as a standard DOCX.

**GET** `/api/export/policy/:id/professional-docx`
Download a policy as a formatted/branded DOCX.

**GET** `/api/export/policy/:id/pdf`
Download a policy as a PDF with cover page and TOC.

**GET** `/api/export/compliance-report/:clientId`
Download a full compliance readiness report (PDF).

**GET** `/api/export/policies-zip/:clientId`
Download all client policies as a ZIP archive.

### AI Streaming
**POST** `/api/ai/generate-stream`
Stream an LLM response (Server-Sent Events).
-   **Body:** `{ userPrompt: string, systemPrompt?: string, temperature?: number }`
-   **Response:** Stream of `{ text: string }` chunks.

### Webhooks
**POST** `/api/webhook/stripe`
Stripe webhook handler for subscription updates.

### Monitoring
**GET** `/api/health`
System health check. Returns status 200 if DB is connected.

**GET** `/api/metrics`
Prometheus metrics (Requires Admin role).

## tRPC API
The tRPC API is organized into routers. See `routers.ts` for the full definition.

### Main Routers
-   `auth`: Authentication (Login, Register, Password Reset)
-   `users`: User management
-   `clients`: Client/Tenant management
-   `policies`: Policy lifecycle (Draft, Review, Approve)
-   `controls`: Control implementation and evidence
-   `risks`: Risk register and assessments
-   `businessContinuity`: BCP, BIA, and Strategies
-   `crm`: Customer Relationship Management module
-   `advisor`: AI Advisor chat and RAG
-   `governance`: Work items and escalations
-   `federal`: NIST/FedRAMP specific modules
-   `billing`: Subscription management

### Usage Example (Frontend)
```typescript
import { trpc } from '@/utils/trpc';

const MyComponent = () => {
  const { data: policies } = trpc.policies.list.useQuery({ clientId: 1 });
  
  const createMutation = trpc.policies.create.useMutation();

  const handleCreate = () => {
    createMutation.mutate({ name: "New Policy", clientId: 1 });
  }
}
```
