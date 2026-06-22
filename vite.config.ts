/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Dev only: mimic the production nginx proxy so the app can call same-origin /api/*.
  server: {
    proxy: {
      '/api/archive': {
        target: 'https://archive-api.open-meteo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/archive/, '/v1/archive'),
      },
      '/api/forecast': {
        target: 'https://api.open-meteo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/forecast/, '/v1/forecast'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Weather Archive',
        short_name: 'WeatherArchive',
        description: 'Consultez les archives météo officielles',
        theme_color: '#1e50a0',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'fr',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'geocoding-api.open-meteo.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/geo/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'geojson',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
