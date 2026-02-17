# OpenClaw WebChat Setup (Locked‑Box)

## Prerequisites
- Node ≥22
- SSO/VPN and reverse proxy
- Environment secrets for model providers (optional in connected mode)

## Steps
- Install OpenClaw and run onboard
- Enable only WebChat channel
- Place Gateway behind SSO reverse proxy and restrict by IP/VPN
- Configure DM pairing and allowlists
- Set TOOL_HMAC_SECRET in environment for signed tool calls
- Point WebChat commands to advisor endpoints; enforce JSON object outputs

## Verification
- “Create implementation plan for CIS control 5” returns a JSON object with citations
- “Draft Access Control section” inserts via Premium slot with audit
- “Reindex our policy KB” updates embeddings and enables grounded citations

## Docker (Containerized Gateway)
- Copy .env.openclaw.example to .env and set values
- Build and run:
  - docker compose -f docker-compose.openclaw.yml up --build -d
- Access Gateway on http://localhost:${OPENCLAW_PORT}
- Run the wizard inside a temporary container if needed:
  - docker run --rm -it complianceos/openclaw:locked-box sh -lc "npm i -g openclaw@latest && openclaw onboard"
