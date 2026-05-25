import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/dev-yandex/geocode': {
        target: 'https://geocode-maps.yandex.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-yandex\/geocode/, '/v1'),
      },
      '/dev-yandex/suggest': {
        target: 'https://suggest-maps.yandex.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-yandex\/suggest/, '/v1/suggest'),
      },
      '/dev-yandex/route': {
        target: 'https://api.routing.yandex.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-yandex\/route/, '/v2/route'),
      },
      '/osrm': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
      },
    },
  },
});
