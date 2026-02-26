#!/bin/bash
# Start takopi for claw-masters-hub bot (@claw_masters_hub_bot)
# Uses a separate config directory to avoid conflicts with the main twin-ai-app bot

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FAKE_HOME="/Users/openclaw/.takopi-claw-home"

echo "Starting takopi for claw-masters-hub..."
echo "Config: $FAKE_HOME/.takopi/takopi.toml"
echo "Project: $SCRIPT_DIR"

cd "$SCRIPT_DIR" && HOME="$FAKE_HOME" takopi
