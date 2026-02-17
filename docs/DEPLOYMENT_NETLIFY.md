# Multi-Domain Deployment on Netlify

Since you are already hosting the main application on Netlify, the most efficient strategy is to create **three separate Netlify sites** linked to the same GitHub repository. This leverages Netlify's CDN, global distribution, and built-in CI/CD without needing complex GitHub Actions or external VPS management.

## Architecture Overview

| Domain | Netlify Site Name (Example) | Source | Env Variables | DB |
| :--- | :--- | :--- | :--- | :--- |
| **app.grcompliance.com** | `grcompliance-app` | `packages/core` | `VITE_APP_MODE=production` | **Prod DB** |
| **demo.grcompliance.com** | `grcompliance-demo` | `packages/core` | `VITE_APP_MODE=demo` | **Demo DB** |
| **grcompliance.com** | `grcompliance-landing` | `packages/landing` | (None) | (None) |

---

## Step 1: Main App (app.grcompliance.com)
*Status: Already Deployed*

Ensure the functionality match the new requirements:
1.  Go to **Site Configuration > Environment Variables**.
2.  Ensure `VITE_ENABLE_PREMIUM` is set to `true`.
3.  Ensure `DATABASE_URL` points to your **Production** PostgreSQL instance (Supabase, Neon, Railway, etc.).
4.  Ensure `VITE_APP_MODE` is `production` (default).

---

## Step 2: Demo App (demo.grcompliance.com)
*Create a new site for the Demo environment.*

1.  **Create New Site**:
    *   In Netlify Dashboard, click **"Add new site"** -> **"Import from Git"**.
    *   Select the **same repository** (`ComplianceOS`).
    *   Branch to deploy: `main`.

2.  **Build Settings** (Same as Main App):
    *   **Base directory**: `.` (Root)
    *   **Build command**: `npm install --legacy-peer-deps --include=dev && npm run build --workspace @complianceos/core`
    *   **Publish directory**: `packages/core/dist`
    *   *(Note: Netlify usually detects these from `netlify.toml` automatically)*.

3.  **Environment Variables (CRITICAL)**:
    *   Go to **Site Configuration > Environment Variables**.
    *   `VITE_ENABLE_PREMIUM` = `true`
    *   `VITE_APP_MODE` = `demo`
        *   *This triggers the read-only guard we added to the backend.*
    *   `DATABASE_URL` = **[Connection string to your ISOLATED Demo Database]**
        *   *Do NOT use the production database string.*

4.  **Custom Domain**:
    *   Go to **Domain Management**.
    *   Add `demo.grcompliance.com`.

---

## Step 3: Landing Page (grcompliance.com)
*Create a new site for the static landing page.*

1.  **Create New Site**:
    *   In Netlify Dashboard, click **"Add new site"** -> **"Import from Git"**.
    *   Select the **same repository** (`ComplianceOS`).
    *   Branch to deploy: `main`.

2.  **Build Settings (OVERRIDE)**:
    *   *You must override the defaults from `netlify.toml` because this is a static site.*
    *   **Base directory**: `packages/landing`
    *   **Build command**: (Leave empty)
    *   **Publish directory**: `.` (Current directory, which means `packages/landing`)

3.  **Custom Domain**:
    *   Go to **Domain Management**.
    *   Add `grcompliance.com` (and `www.grcompliance.com`).

---

## Database Configuration (Supabase/Neon/Railway)
Since Netlify is serverless, you need an external PostgreSQL provider.

1.  **Production DB**: Create a project named `compliance-prod`.
2.  **Demo DB**: Create a separate project (or logical database) named `compliance-demo`.
    *   Seed this database with safe, anonymous data.
    *   Run `npm run seed:demo` (if available) or standard seed scripts against this URL locally before deploying.

## Summary of Safety Mechanisms
1.  **Data Isolation**: The `demo` site uses a completely different `DATABASE_URL`. Even if the code has bugs, it physically cannot touch production data.
2.  **Mutation Guard**: The `VITE_APP_MODE=demo` flag activates the `demoModeGuard` in `src/server/trpc.ts`, which rejects all `mutation` requests at the API level (except for login).
