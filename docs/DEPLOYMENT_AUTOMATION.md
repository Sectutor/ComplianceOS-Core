# Multi-Domain Deployment Automation Guide

This guide explains how to set up the fully automated CI/CD pipeline using GitHub Actions to deploy your 3-domain architecture.

## 1. Prerequisites (Server Side)
Before running the workflow, ensure your VPS is ready.

1.  **Install Docker & Nginx**:
    ```bash
    sudo apt update
    sudo apt install -y docker.io docker-compose nginx unzip
    sudo usermod -aG docker $USER
    ```

2.  **Prepare Directories**:
    Create the folder for the landing page static files:
    ```bash
    sudo mkdir -p /var/www/grcompliance-landing
    sudo chown -R $USER:$USER /var/www/grcompliance-landing
    ```

3.  **Configure Nginx**:
    - Copy the template from `infrastructure/nginx.conf.template` to `/etc/nginx/sites-available/grcompliance`.
    - Edit it if needed (check domain names).
    - Enable it:
      ```bash
      sudo ln -s /etc/nginx/sites-available/grcompliance /etc/nginx/sites-enabled/
      sudo nginx -t
      sudo systemctl reload nginx
      ```

4.  **SSL Certificates (HTTPS)**:
    Run Certbot for all domains:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d grcompliance.com -d www.grcompliance.com -d app.grcompliance.com -d demo.grcompliance.com
    ```

## 2. GitHub Secrets Configuration
Go to your **GitHub Repo -> Settings -> Secrets and variables -> Actions** and add the following secrets:

### Infrastructure Access
| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `VPS_HOST` | IP Address of your server | `192.0.2.1` |
| `VPS_USER` | SSH Username | `ubuntu` or `root` |
| `SSH_PRIVATE_KEY` | Private SSH Key for access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Application Configuration
| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `PROD_DATABASE_URL` | Production Database Connection String | `postgresql://user:pass@db-host:5432/grcompliance_prod` |
| `DEMO_DATABASE_URL` | **SEPARATE** Default Database for Demo | `postgresql://user:pass@db-host:5432/grcompliance_demo` |
| `REDIS_URL` | Redis Connection String | `redis://redis-host:6379` |
| `VITE_LICENSE_KEY` | Optional: Global license key | `...` |

## 3. Workflow Logic (`.github/workflows/deploy-multi-domain.yml`)

The workflow performs two main jobs:

### Job 1: Build & Push
- Builds the Docker image `ghcr.io/your-user/compliance-os:latest`.
- Sets `VITE_ENABLE_PREMIUM=true` during build so the image has all features.

### Job 2: Deploy
- **Landing Page**: Uses `scp` to copy `packages/landing/*` to `/var/www/grcompliance-landing` on your server.
- **Applications**: SSHs into your server and runs two Docker containers:
  1.  **Production App** (`compliance-prod`):
      - Runs on port `3001`.
      - Env: `VITE_APP_MODE=production`.
      - DB: Uses `PROD_DATABASE_URL`.
  2.  **Demo App** (`compliance-demo`):
      - Runs on port `3002`.
      - Env: `VITE_APP_MODE=demo` (activates read-only mutation guard).
      - DB: Uses `DEMO_DATABASE_URL`.

## 4. Verification
After the workflow runs successfully:
1.  Visit `https://grcompliance.com` -> You should see the static landing page.
2.  Visit `https://app.grcompliance.com` -> You should see the login page for Production.
3.  Visit `https://demo.grcompliance.com` -> You should see the login page, but attempting data edits will fail (Read-Only).
