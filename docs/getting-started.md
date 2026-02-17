# Getting Started with ComplianceOS

This guide will help you set up the ComplianceOS development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (v15+ recommended, or use a cloud provider like Supabase/Neon)
- **Git**

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd ComplianceOS
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Environment Configuration

1.  Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

2.  Update the `.env` file with your local configuration:

    ```env
    # Database Connection String
    DATABASE_URL="postgres://user:pass@host:5432/dbname?sslmode=require"
    
    # Server Port
    PORT=3001
    
    # CORS Settings (Frontend URL)
    CORS_ORIGIN=http://localhost:5173
    
    # Rate Limiting
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX=200
    
    # AI Services (Optional for basic dev, required for AI features)
    OPENAI_API_KEY="sk-..."
    ANTHROPIC_API_KEY="sk-..."
    
    # Stripe (Optional for billing features)
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    ```

## Database Setup

1.  **Push the schema to your database:**

    ```bash
    npm run db:push
    ```

    This command uses Drizzle Kit to apply the schema defined in `schema.ts` to your PostgreSQL database.

2.  **Seed default data (Optional):**

    The application attempts to seed default data on startup, but you can also run specific seed scripts found in `scripts/seed/`.

3.  **Open Drizzle Studio (Database GUI):**

    ```bash
    npm run db:studio
    ```

    This will open a web interface to view and edit your database records.

## Running the Application

ComplianceOS consists of a Frontend (Vite/React) and a Backend (Express/Node).

### 1. Start the Backend Server

```bash
npm run server
```

This starts the Express server on `http://localhost:3001` (or the PORT defined in .env).

### 2. Start the Frontend Development Server

Open a new terminal and run:

```bash
npm run dev
```

This starts the Vite development server, usually at `http://localhost:5173`.

## Development Commands

-   `npm run check`: Run TypeScript type checking.
-   `npm run lint`: Run ESLint to catch code quality issues.
-   `npm run test`: Run unit tests with Vitest.
-   `npm run build`: Build the frontend for production.

## Next Steps

-   Review the [Architecture Guide](./architecture.md) to understand the system design.
-   Check the [API Reference](./api-reference.md) for backend endpoints.
