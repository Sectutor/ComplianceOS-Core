# Multi-Domain Deployment Strategy

This project supports two primary deployment strategies:

## 1. Netlify (Recommended)
Since you are already using Netlify for the main application, we recommend deploying all three domains as separate Netlify sites linked to this repository. This provides built-in CI/CD, global CDN, and zero server maintenance.

**[See Full Netlify Deployment Guide](./DEPLOYMENT_NETLIFY.md)**

## 2. Docker / VPS (Alternative)
If you prefer full control over the infrastructure (e.g., DigitalOcean, AWS EC2), you can use the provided Docker setup and Nginx configuration.

**[See Automated VPS Deployment Guide](./DEPLOYMENT_AUTOMATION.md)**

---

## Architecture Summary

| Domain | Purpose | Netlify Site | VPS Container |
| :--- | :--- | :--- | :--- |
| **grcompliance.com** | Marketing Landing Page | `grcompliance-landing` | Static Nginx |
| **demo.grcompliance.com** | Read-Only Demo | `grcompliance-demo` | `compliance-demo` |
| **app.grcompliance.com** | SaaS Application | `grcompliance-app` | `compliance-prod` |

### Database Isolation (CRITICAL)
 regardless of deployment method, **you MUST use separate databases for Demo and Production environments.**

*   **Production**: `DATABASE_URL=postgresql://.../prod_db`
*   **Demo**: `DATABASE_URL=postgresql://.../demo_db`
