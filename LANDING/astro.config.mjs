// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://smartur.duckdns.org",
  base: "/",
  integrations: [react(), tailwind()],
  vite: {
    server: {
      allowedHosts: ['smartur.duckdns.org'],
    },
  },
  scopedStyleStrategy: "where",
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
