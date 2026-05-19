import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "src/features/dashboard-admin",
  // Cache separado del de la landing (5173) para evitar que ambos servidores
  // corrompan el mismo directorio node_modules/.vite al ejecutarse en paralelo.
  cacheDir: "../../../node_modules/.vite-dashboard",
  build: {
    outDir: "../../../dist-dashboard",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  resolve: {
    alias: {
      "@dashboard": path.resolve(__dirname, "./src/features/dashboard-admin"),
    },
  },
  // Forzar pre-bundle de axios para asegurar conversión CJS→ESM correcta
  optimizeDeps: {
    include: ["axios"],
  },
});
