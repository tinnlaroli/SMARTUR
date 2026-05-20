import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      // ⚠️ Desactivar el Service Worker en desarrollo.
      // En dev, el SW intercepta las peticiones de módulos de Vite y devuelve
      // respuestas con MIME type vacío, rompiendo la carga de dependencias.
      disable: mode === "development",
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "smartur_logo.png"],
      manifest: {
        name: "SMARTUR",
        short_name: "SMARTUR",
        description: "Sistema de recomendaciones turísticas",
        theme_color: "#FC478E",
        background_color: "#FFFFFF",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  // Forzar la inclusión de AOS en el optimizador de dependencias.
  // El optimizador convierte el módulo CJS de AOS a ESM, que es lo que
  // necesita Vite. Sin esto, Vite sirve el archivo CJS crudo sin export default.
  optimizeDeps: {
    include: ["aos"],
  },
}));
