#!/bin/bash
# SMARTUR PostgreSQL Backup — corre diario a las 3am via cron
# Guarda 7 días de backups en /opt/backups/

set -euo pipefail

ENV_FILE="/opt/SMARTUR/.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-smartur}"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/smartur-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec smartur-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"

# Eliminar backups de más de 7 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "✓ Backup guardado: $FILE ($(du -sh "$FILE" | cut -f1))"
logger -t smartur-backup "Backup completado: $FILE"
