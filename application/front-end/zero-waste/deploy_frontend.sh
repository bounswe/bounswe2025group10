#!/usr/bin/env bash
set -euo pipefail

# Config (change if needed)
PROJECT_ROOT="/root/bounswe2025group10"
FRONTEND_DIR="$PROJECT_ROOT/application/front-end/zero-waste"
IMAGE_NAME="zero-waste-frontend"
CONTAINER_NAME="zero-waste-frontend"
HOST_IP="${HOST_IP:-$(curl -s ifconfig.me || echo "YOUR_DROPLET_IP")}"

# Preferred port can be overridden: FRONTEND_PORT=8080 ./deploy_frontend.sh
PREFERRED_PORT="${FRONTEND_PORT:-80}"
FALLBACK_PORT="8080"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: $1 is not installed."; exit 1; }
}

pick_port() {
  local port="$1"
  if lsof -i TCP:"$port" -s TCP:LISTEN -P -n >/dev/null 2>&1; then
    echo ""
  else
    echo "$port"
  fi
}

main() {
  require docker
  require lsof || true  # optional; if missing we’ll still try to run and detect failure

  if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    echo "Error: $FRONTEND_DIR/.env.production not found. Create it with VITE_API_URL first."
    exit 1
  fi

  echo "Building image: $IMAGE_NAME"
  docker build -t "$IMAGE_NAME" "$FRONTEND_DIR"

  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"; then
    echo "Stopping and removing existing container: $CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  PORT_TO_USE="$(pick_port "$PREFERRED_PORT")"
  if [ -z "$PORT_TO_USE" ]; then
    echo "Port $PREFERRED_PORT is busy. Trying $FALLBACK_PORT..."
    PORT_TO_USE="$(pick_port "$FALLBACK_PORT")"
    if [ -z "$PORT_TO_USE" ]; then
      echo "Both $PREFERRED_PORT and $FALLBACK_PORT are busy. Set FRONTEND_PORT to a free port and retry."
      exit 1
    fi
  fi

  echo "Running container on host port $PORT_TO_USE → container 80"
  docker run -d --name "$CONTAINER_NAME" -p "${PORT_TO_USE}:80" "$IMAGE_NAME"

  echo "Waiting for container to start..."
  sleep 2

  URL="http://${HOST_IP}:${PORT_TO_USE}"
  echo "Attempting to reach $URL"
  curl -sSf "$URL" >/dev/null 2>&1 && echo "Frontend is up at $URL" || echo "Container started. If curl failed, wait a few seconds then open $URL"
}

main "$@"