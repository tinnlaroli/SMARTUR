# ============================================================
# Dockerfile — smartur-landing
# Build: Astro + React → Nginx static files
# ============================================================

# ── Etapa 1: Build ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

# ── Etapa 2: Servir con Nginx ──────────────────────────────
FROM nginx:alpine

# Copiar build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4321

CMD ["nginx", "-g", "daemon off;"]