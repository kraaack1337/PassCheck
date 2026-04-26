import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    // Проксируем запросы к бэкенду — избегаем CORS проблем при разработке
    proxy: {
      '/api': {
        // В Docker: VITE_BACKEND_URL=http://backend:3001
        // Локально: по умолчанию http://localhost:3001
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
