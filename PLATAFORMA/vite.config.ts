import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: "/smartur-plataforma/",
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    proxy: {
      '/api/v2': {
        target: process.env.VITE_API_URL || 'http://api:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
