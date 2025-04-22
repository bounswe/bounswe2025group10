#!/usr/bin/env bash
set -euo pipefail

# ─── Determine Project Root ───────────────────────────────────
if [[ -n "${WORKSPACE-}" ]]; then
  # Running under Jenkins
  ROOT_DIR="$WORKSPACE"
else
  # Running locally: assume this script lives in application/backend
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

BACKEND_DIR="$ROOT_DIR/application/backend"
VENV_ACTIVATE="$BACKEND_DIR/venv/bin/activate"

# ─── Step 1: Update Git branch ───────────────────────────────
echo "🔄 Updating backend branch..."
cd "$ROOT_DIR"
git stash
git fetch origin
git checkout backend
git pull origin backend

# ─── Step 2: Activate virtualenv if present ─────────────────
echo "🐍 Activating virtual environment (if it exists)..."
if [ -f "$VENV_ACTIVATE" ]; then
  # shellcheck source=/dev/null
  source "$VENV_ACTIVATE"
else
  echo "ℹ️  No venv found at $VENV_ACTIVATE, skipping."
fi

# ─── Step 3: Fix SQL file permissions ────────────────────────
echo "🔧 Setting permissions on SQL files..."
chmod 644 "$BACKEND_DIR/sql/"*.sql

# ─── Step 4: Rebuild Docker services ─────────────────────────
echo "🐳 Shutting down existing containers and removing volumes..."
cd "$BACKEND_DIR"
docker compose down -v

echo "🛠️  Building Docker images..."
docker compose build

# ─── Step 5: Free up ports ───────────────────────────────────
kill_port() {
  local port=$1
  if lsof -i :"$port" &> /dev/null; then
    echo "💀 Killing process on port $port..."
    kill -9 "$(lsof -t -i :"$port")"
  else
    echo "✔️  No process on port $port"
  fi
}

kill_port 8000
kill_port 3306

# ─── Step 6: Start services & migrate ────────────────────────
echo "🚀 Starting containers in detached mode..."
docker compose up -d

echo "📦 Running Django migrations..."
docker compose exec web python manage.py migrate

echo "✅ Done!"
