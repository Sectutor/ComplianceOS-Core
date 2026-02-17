#!/bin/sh
set -e
export NODE_ENV=production
npm i -g openclaw@latest
openclaw gateway --port ${OPENCLAW_PORT:-18789} --verbose
