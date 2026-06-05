# ============================================================
# Dockerfile — api-smartur
# Node.js 22 Alpine (ligero y seguro)
# ============================================================

# ── Etapa 1: Dependencias ──────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Herramientas de compilación para módulos nativos (canvas, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pkgconfig

# Copiar manifiestos para aprovechar cache de capas
COPY package.json package-lock.json ./

RUN npm install --omit=dev --no-audit

# ── Etapa 2: Imagen Final ──────────────────────────────────
FROM node:22-alpine AS runner

# Instalar curl y libs de runtime para canvas
RUN apk add --no-cache \
    curl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 apiuser

# Copiar módulos desde etapa deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=apiuser:nodejs . .

# Cambiar al usuario sin privilegios
USER apiuser

# Puerto expuesto (debe coincidir con PORT en .env)
EXPOSE 3000

# Healthcheck: verifica que la API responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "index.js"]
