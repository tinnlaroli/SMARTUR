#!/bin/bash
# SMARTUR VPS Setup — ejecutar una vez en servidor limpio
# Configura Docker log rotation, backups y cron jobs

set -euo pipefail

echo "=== SMARTUR VPS Setup ==="

# 1. Docker log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker
echo "✓ Docker log rotation configurado (10MB x 3 archivos)"

# 2. Reiniciar contenedores para aplicar log rotation
cd /opt/SMARTUR
docker compose -f docker-compose.yml up -d
echo "✓ Contenedores reiniciados"

# 3. Permisos de scripts
chmod +x /opt/SMARTUR/scripts/*.sh
echo "✓ Permisos de scripts configurados"

# 4. Cron jobs
CRON_HEALTH="*/5 * * * * /opt/SMARTUR/scripts/healthcheck.sh >> /var/log/smartur-health.log 2>&1"
CRON_BACKUP="0 3 * * * /opt/SMARTUR/scripts/backup-db.sh >> /var/log/smartur-backup.log 2>&1"

(crontab -l 2>/dev/null | grep -v "healthcheck\|backup-db"; echo "$CRON_HEALTH"; echo "$CRON_BACKUP") | crontab -
echo "✓ Cron jobs instalados:"
crontab -l

# 5. Directorio de backups
mkdir -p /opt/backups
echo "✓ Directorio /opt/backups creado"

echo ""
echo "=== Setup completado ==="
