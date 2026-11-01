import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: { port: 5175, strictPort: true },
  plugins: [
    react(),
    // Lets the app open with no signal. It precaches the app's own files only: API
    // responses carry the bearer token, and offline data lives in the persisted query
    // cache and the outbox. A new version waits until the app's tabs are closed, so an
    // inspector mid-form is never reloaded.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script-defer',
      workbox: {
        globPatterns: ['**/*.{html,js,css,woff2}'],
        navigateFallback: '/index.html',
        skipWaiting: false,
        clientsClaim: false,
      },
      manifest: {
        name: 'تفتيش المواقع الإنشائية',
        short_name: 'التفتيش',
        description: 'تفتيش المواقع الإنشائية',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        theme_color: '#265a61',
        background_color: '#f5f2ec',
      },
    }),
  ],
})
