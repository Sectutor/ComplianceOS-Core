# Deployment Guide

ComplianceOS is designed to be deployed on **Netlify** (Frontend + Serverless Functions) with a **PostgreSQL** database (e.g., Supabase, Neon, AWS RDS).

## 1. Database Deployment
Before deploying the app, you need a hosted PostgreSQL database.

1.  **Provision a Database:**
    -   **Supabase:** Create a new project. Get the connection string (Transaction mode recommended for serverless).
    -   **Neon:** Create a project. Get the connection string.
2.  **Apply Schema:**
    -   Locally, update your `.env` with the *production* `DATABASE_URL`.
    -   Run `npm run db:push` to deploy the schema.
    -   (Optional) Run seed scripts if needed.

## 2. Netlify Deployment

### Prerequisites
-   A GitHub/GitLab repository with the code.
-   A Netlify account.

### Steps
1.  **Import Project:**
    -   Log in to Netlify and click "Add new site" -> "Import an existing project".
    -   Connect your Git provider and select the repository.

2.  **Build Configuration:**
    -   Netlify should auto-detect settings from `netlify.toml`.
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `dist`
    -   **Functions Directory:** `netlify/functions`

3.  **Environment Variables:**
    -   Go to **Site Settings > Environment Variables**.
    -   Add all variables from your local `.env` file (e.g., `DATABASE_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`).
    -   **Important:** Ensure `DATABASE_URL` points to your production database.

4.  **Deploy:**
    -   Click "Deploy Site".

## 3. Post-Deployment
-   **Webhooks:** Configure Stripe webhooks to point to `https://your-site.netlify.app/api/webhook/stripe`.
-   **CORS:** If your frontend and backend domains differ (unlikely on Netlify), ensure `CORS_ORIGIN` is set correctly.

## Alternative: Docker / VPS
You can also deploy as a standard Node.js app using Docker.
1.  Build the frontend (`npm run build`).
2.  Start the server (`npm run server`).
3.  Serve the `dist` folder as static files from Express (requires code modification to `index.ts` to serve static assets).
