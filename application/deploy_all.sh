#!/usr/bin/env bash
set -euo pipefail

# General deploy script
# 1) Saves DB via backend script
# 2) Builds and runs the frontend

BACKEND_SCRIPT="/Users/erenakcin/Desktop/codes/new451/bounswe2025group10/application/backend/deploy_save_db.sh"
FRONTEND_SCRIPT="/Users/erenakcin/Desktop/codes/new451/bounswe2025group10/application/front-end/zero-waste/deploy_frontend.sh"

echo "[deploy] Starting deployment..."

if [ ! -f "$BACKEND_SCRIPT" ]; then
  echo "[deploy] Error: Backend deploy script not found at $BACKEND_SCRIPT"
  exit 1
fi

if [ ! -x "$BACKEND_SCRIPT" ]; then
  echo "[deploy] Making backend deploy script executable"
  chmod +x "$BACKEND_SCRIPT"
fi

if [ ! -f "$FRONTEND_SCRIPT" ]; then
  echo "[deploy] Error: Frontend deploy script not found at $FRONTEND_SCRIPT"
  exit 1
fi

if [ ! -x "$FRONTEND_SCRIPT" ]; then
  echo "[deploy] Making frontend deploy script executable"
  chmod +x "$FRONTEND_SCRIPT"
fi

echo "[deploy] Step 1/2: Running backend DB save script..."
"$BACKEND_SCRIPT"
echo "[deploy] Backend DB save completed."

echo "[deploy] Step 2/2: Running frontend deploy script..."
# Pass through optional env like FRONTEND_PORT or HOST_IP if present
env | grep -E '^(FRONTEND_PORT|HOST_IP)=' >/dev/null 2>&1 || true
"$FRONTEND_SCRIPT"
echo "[deploy] Frontend deployment triggered."

echo "[deploy] Deployment finished successfully."


