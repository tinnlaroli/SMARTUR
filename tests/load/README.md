# Pruebas de Carga — SMARTUR

## Instalación de k6

```bash
# Windows
winget install k6

# macOS
brew install k6
```

## Obtener credenciales de prueba

El login tiene 2FA por correo, así que primero obtén el token manualmente:

```bash
# 1. Login — te manda el código al correo
curl -X POST https://app.smartur.online/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'

# 2. Verificar con el código del correo
curl -X POST https://app.smartur.online/api/v2/two-factor \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","token":"123456"}'

# Guarda el "token" y "user.id" de la respuesta
```

## Correr los tests

```bash
# Variables necesarias
export BASE_URL=https://app.smartur.online
export ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
export USER_ID=42

# 1. Smoke test (verificar que funciona — 30s)
k6 run tests/load/smoke.js \
  -e BASE_URL=$BASE_URL -e ACCESS_TOKEN=$ACCESS_TOKEN -e USER_ID=$USER_ID

# 2. Load test (carga gradual — 5 min)
k6 run tests/load/load.js \
  -e BASE_URL=$BASE_URL -e ACCESS_TOKEN=$ACCESS_TOKEN -e USER_ID=$USER_ID

# 3. Stress test (punto de quiebre — 10 min ⚠️)
k6 run tests/load/stress.js \
  -e BASE_URL=$BASE_URL -e ACCESS_TOKEN=$ACCESS_TOKEN -e USER_ID=$USER_ID
```

## Qué significa el resultado

| Métrica | Verde | Amarillo | Rojo |
|---------|-------|----------|------|
| Error rate | < 1% | 1–5% | > 5% |
| Latencia P95 | < 2s | 2–5s | > 5s |
| ML recommend P95 | < 5s | 5–12s | timeout (15s) |
| Errores 429 | 0 | pocos | constantes |

## Monitorear el VPS mientras corres el stress test

```bash
# En otra terminal conectada al VPS
watch -n 2 docker stats --no-stream
```

Esto muestra CPU y memoria de cada contenedor en tiempo real.
