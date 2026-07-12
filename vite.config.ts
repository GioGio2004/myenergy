import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MyEnerge — Energy Stewards of Georgia',
        short_name: 'MyEnerge',
        description: 'ააშენე ცოცხალი ენერგო-ქალაქი, გაანათე საქართველო და შეამცირე იმპორტზე დამოკიდებულება.',
        lang: 'ka',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        background_color: '#1a1423',
        theme_color: '#f2a541',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,glb,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
})
