#!/bin/bash
# SMARTUR PostgreSQL Backup — corre diario a las 3am via cron
# Guarda 7 días de backups en /opt/backups/

set -euo pipefail

# NO usar `source .env`: ese archivo contiene valores no aptos para ejecutar en
# shell (p.ej. FIREBASE_SERVICE_ACCOUNT en base64), y con `set -euo pipefail`
# eso abortaba el backup antes del pg_dump. Extraemos solo lo que necesitamos.
# (pg_dump vía `docker exec` usa auth peer dentro del contenedor — sin password.)
ENV_FILE="/opt/SMARTUR/.env"
_read_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"'"' ; }

DB_USER="$(_read_env DB_USER)"; DB_USER="${DB_USER:-postgres}"
DB_NAME="$(_read_env DB_NAME)"; DB_NAME="${DB_NAME:-smartur}"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/smartur-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec smartur-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"

# Eliminar backups de más de 7 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "✓ Backup guardado: $FILE ($(du -sh "$FILE" | cut -f1))"
logger -t smartur-backup "Backup completado: $FILE"
