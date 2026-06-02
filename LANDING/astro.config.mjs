// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://smartur.online",
  base: "/",
  integrations: [react(), tailwind()],
  scopedStyleStrategy: "where",
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei', '@splinetool/runtime'],
            animations: ['gsap', '@gsap/react', 'framer-motion', 'lenis'],
            viz: ['recharts', 'flubber'],
            lottie: ['@dotlottie/player-component'],
            ogl: ['ogl'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    ssr: {
      external: ['sqlite3'],
    },
  },
  image: {
    domains: ['wikimedia.org', 'commons.wikimedia.org'],
    remotePatterns: [{ protocol: 'https' }],
  },
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en", "fr", "pt"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
