# Clawbot (OpenClaw) Quickstart — Local Gateway + Control UI

## Goal
Bring up OpenClaw locally and chat via the Control UI (no external channels), then prepare the Security Advisor agent for tool integrations.

## Prereqs
- Node 22+, Docker Desktop (Linux engine), port 18789 open locally
- Env: copy .env.openclaw.example to .env and set TOOL_HMAC_SECRET

## Start the Gateway
- Using Docker (recommended for locked‑box):
  - docker compose -f docker-compose.openclaw.yml up --build -d
  - Verify: docker ps --filter name=openclaw_gateway; docker logs openclaw_gateway --tail 50
- Or run directly on the host:
  - npm i -g openclaw@latest
  - openclaw gateway run --port 18789

## Onboard (Wizard)
- Interactive CLI:
  - openclaw onboard
  - Choose: Control UI, WebChat only, pairing/allowlists
- Health:
  - openclaw doctor
  - openclaw security audit

## Control UI
- Open http://127.0.0.1:18789/ and start a chat
- Fastest path: Control UI requires no channel setup

## Create the Security Advisor Agent
- CLI:
  - openclaw agents add "Security Advisor"
  - openclaw models set --agent "Security Advisor" anthropic/claude-sonnet-4-5
  - openclaw agents list
- Config file (optional hot‑reload):
  - ~/.openclaw/openclaw.json
  - {
    "gateway": { "port": 18789 },
    "agents": { "defaults": { "workspace": "~/.openclaw/workspace" } }
  }

## Next Steps (Tools Integration)
- Use scripts/tool-sign-demo.ts to generate HMAC headers for advisor calls
- Bind tool plugins (askQuestion, implementationPlan, reindexContent) after Security Advisor is chatting
- See docs/setup/openclaw-webchat.md for containerized setup details

## References
- CLI Reference: https://docs.openclaw.ai/cli
- Gateway Configuration: https://docs.openclaw.ai/gateway/configuration
- Getting Started (Control UI): https://docs.openclaw.ai/start/getting-started
