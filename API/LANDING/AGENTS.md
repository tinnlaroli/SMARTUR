# AGENTS.md — LANDING (Marketing Site)

## Overview

Astro 5 + React 19 marketing landing page for SMARTUR. Multi-language support (ES, EN, FR), 3D elements via Three.js/React-Three-Fiber.

## Key commands

```bash
# Local development
npm run dev          # Starts Astro on port 4321

# Build for production
npm run build        # Outputs to dist/

# Preview production build
npm run preview

# Docker
docker compose build landing
docker compose up -d landing
```

## Environment

- **Dev port**: 4321
- **Base path**: `/` (configured in astro.config.mjs as `base: "/"`)
- **Public vars**: `PUBLIC_TOURIST_APP_URL` — links to PLATAFORMA

## Important gotchas

- **Package manager**: Uses pnpm locally, but Docker build uses npm (to avoid pnpm script restrictions).
- **Build deps**: Requires build scripts for esbuild, sharp — these are handled in Docker via `npm install`.
- **i18n**: Astro i18n with `defaultLocale: "es"`, locales: `["es", "en", "fr"]`.
- **SPA routing**: Nginx uses `try_files $uri $uri/ /index.html` for Astro's static output.
- **Assets**: 3D models in `src/assets/3d/`, images in `src/assets/imgs/`.

## File structure

```
LANDING/
├── src/
│   ├── pages/
│   │   ├── index.astro     # Spanish home
│   │   ├── en/index.astro  # English
│   │   └── fr/index.astro  # French
│   ├── components/          # Astro components
│   ├── layouts/Layout.astro
│   ├── styles/             # Global CSS
│   ├── assets/
│   │   ├── imgs/           # Images
│   │   ├── video/          # Videos
│   │   ├── 3d/             # 3D models (.glb files)
│   │   └── *.lottie        # Animation files
│   └── utils/              # JS utilities
├── nginx.conf              # Production nginx config
├── astro.config.mjs        # Astro config
├── tailwind.config.mjs     # Tailwind config
└── package.json
```