import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a new version waits until the app says it's safe to reload
      // (src/components/feedback/PwaManager.tsx) — never in the middle of a quiz
      registerType: 'prompt',
      includeAssets: ['logoIcon.png', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        id: '/',
        name: 'Accounting with Asela',
        short_name: 'Asela LMS',
        description: 'A/L Accounting quizzes, results and class materials — Paradise of Accounting',
        lang: 'en',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?source=pwa',
        scope: '/',
        categories: ['education'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'My quizzes', short_name: 'Quizzes', url: '/student/quizzes', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'My results', short_name: 'Results', url: '/student/trend', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Study materials', short_name: 'Materials', url: '/student/materials', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // The app shell (JS/CSS/HTML/icons) is precached so it opens instantly
        // and offline; deep links fall back to index.html
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Question images (CloudFront) — immutable per key, so cache-first
            urlPattern: ({ url }) => url.hostname.endsWith('.cloudfront.net'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'question-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com' || url.hostname === 'api.dicebear.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static-assets', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          // API responses are personal and change constantly: never cached
          { urlPattern: ({ url }) => url.hostname.includes('execute-api'), handler: 'NetworkOnly' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Big libraries in their own long-cached chunks, so an app update
        // doesn't make phones re-download them
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // recharts is deliberately NOT forced into a chunk: left alone it is only
          // pulled in by the (lazy) pages that draw charts
          if (id.includes('amazon-cognito-identity-js') || id.includes('buffer') || id.includes('crypto-js')) return 'auth'
          if (id.includes('motion') || id.includes('framer')) return 'motion'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('@tanstack') || id.includes('axios')) return 'data'
          if (id.includes('date-fns')) return 'dates'
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
  },
})
