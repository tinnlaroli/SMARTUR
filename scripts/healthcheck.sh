#!/bin/bash
# SMARTUR Health Check — corre cada 5 min via cron
# Configura TELEGRAM_TOKEN y TELEGRAM_CHAT_ID en /opt/SMARTUR/.env

set -euo pipefail

# Prevent cron accumulation: exit immediately if another instance is running
LOCK_FILE="/tmp/smartur_healthcheck.lock"
exec 9>"$LOCK_FILE"
flock -n 9 || { logger -t smartur-health "health check already running, skipping"; exit 0; }

ENV_FILE="/opt/SMARTUR/.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

TELEGRAM_TOKEN="${TELEGRAM_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
COMPOSE_DIR="/opt/SMARTUR"

send_alert() {
  local msg="$1"
  if [ -n "$TELEGRAM_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s --max-time 10 -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="🚨 *SMARTUR VPS*: ${msg}" \
      -d parse_mode="Markdown" > /dev/null
  fi
  logger -t smartur-health "$msg"
}

SERVICES=("smartur-postgres" "smartur-api" "smartur-modelo" "smartur-plataforma" "smartur-landing" "smartur-nginx")

for service in "${SERVICES[@]}"; do
  status=$(timeout 10 docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null || echo "missing")
  health=$(timeout 10 docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$service" 2>/dev/null || echo "unknown")

  if [ "$status" != "running" ]; then
    send_alert "Contenedor *${service}* caído (status: ${status}). Intentando restart..."
    cd "$COMPOSE_DIR" && docker compose -f docker-compose.yml restart "$service" 2>/dev/null || true
  elif [ "$health" = "unhealthy" ]; then
    send_alert "Contenedor *${service}* unhealthy. Verificar logs."
  fi
done
