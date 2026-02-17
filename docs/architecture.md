# ComplianceOS Architecture

## Overview

ComplianceOS is a comprehensive Governance, Risk, and Compliance (GRC) platform designed to help organizations manage their security posture, compliance frameworks, and risks. It leverages a modern full-stack architecture with AI-driven capabilities.

## Technology Stack

### Frontend
-   **Framework:** React (v18)
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS + Shadcn UI (Radix UI primitives)
-   **State Management:** React Query (TanStack Query)
-   **Routing:** Wouter (Lightweight router)
-   **Language:** TypeScript

### Backend
-   **Runtime:** Node.js
-   **Server:** Express.js
-   **API Layer:**
    -   **tRPC:** For type-safe client-server communication.
    -   **REST:** For specific endpoints (File uploads, Webhooks, Exports).
-   **Database ORM:** Drizzle ORM
-   **Language:** TypeScript

### Database
-   **Primary Store:** PostgreSQL
-   **Vector Store:** pgvector (for AI/RAG features)
-   **Schema Management:** Drizzle Kit

### AI & Services
-   **LLM Providers:** OpenAI, Anthropic (configurable via `lib/llm`)
-   **RAG:** Embedding generation and vector search for Knowledge Base and Control suggestions.
-   **Payments:** Stripe Integration

## System Components

### 1. Frontend Architecture
The frontend is organized into logical modules:
-   **`pages/`**: Application routes (e.g., `pages/risk`, `pages/compliance`).
-   **`components/`**: Reusable UI components.
    -   **`ui/`**: Base design system components (buttons, inputs, etc.).
    -   **`risk/`, `compliance/`, `governance/`**: Feature-specific components.
-   **`hooks/`**: Custom React hooks (e.g., `useAuth`, `useAdvisor`).
-   **`layouts/`**: Page layouts (Sidebar, Header).

### 2. Backend Architecture
The backend serves as both the API provider and the application server.
-   **`index.ts`**: Main entry point. Sets up Express, Middleware (Auth, CORS, Rate Limit), and Routes.
-   **`routers/`**: tRPC routers defining the API procedures.
-   **`netlify/functions/api.ts`**: Serverless entry point for Netlify deployment.

### 3. Data Layer
Data access is managed via Drizzle ORM.
-   **`schema.ts`**: Defines the database tables, enums, and relationships.
-   **`db.ts`**: Database connection configuration.
-   **`drizzle/`**: Migration files.

### 4. AI & RAG Engine
The AI features (Compliance Advisor, Risk Analysis) rely on:
-   **`lib/llm/`**: Service abstraction for calling LLM APIs.
-   **`lib/ai/`**: Specific AI logic (Control suggestions, Intake triage).
-   **`lib/advisor/`**: RAG implementation (Retrieval Augmented Generation).
    -   **Embeddings:** Text is converted to vectors and stored in the `embeddings` table.
    -   **Retrieval:** Queries match against stored vectors to provide context to the LLM.

## Project Structure

```
ComplianceOS/
├── components/         # React components
├── docs/               # Documentation
├── drizzle/            # Database migrations
├── lib/                # Shared utilities and business logic
│   ├── ai/             # AI specific logic
│   ├── llm/            # LLM service wrappers
│   └── ...
├── netlify/            # Netlify serverless functions
├── pages/              # React pages/routes
├── public/             # Static assets
├── scripts/            # Utility scripts (seed, maintenance)
├── _core/              # Core utilities (env, hooks)
├── index.ts            # Backend server entry point
├── schema.ts           # Database schema definition
└── db.ts               # Database connection
```
