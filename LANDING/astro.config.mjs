// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "http://localhost",
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
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Roboto Slab",
        cssVariable: "--font-roboto-slab",
        weights: ["100 900"],
      },
      {
        provider: fontProviders.google(),
        name: "Inter",
        cssVariable: "--font-inter",
        weights: ["100 900"],
      },
    ],
  },
});
