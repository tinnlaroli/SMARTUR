# ============================================================
# Dockerfile — smartur-plataforma (Dashboard)
# Build: React + Vite → Nginx static files
# ============================================================

# ── Etapa 1: Build ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_MODELO_URL
ARG VITE_BUSINESS_URL
ARG VITE_SENTRY_DSN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MODELO_URL=$VITE_MODELO_URL
ENV VITE_BUSINESS_URL=$VITE_BUSINESS_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npx vite build

# ── Etapa 2: Servir con Nginx ──────────────────────────────
FROM nginx:alpine

# Copiar build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]