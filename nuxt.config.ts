// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  ssr: true,

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-01-01',

  devtools: { enabled: true },

  // CSS global
  css: ['~/assets/css/main.css'],

  // Variables de entorno
  runtimeConfig: {
    // Server-only (nunca se exponen al cliente)
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',

    // Variables públicas (accesibles en cliente con useRuntimeConfig().public)
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
      siteUrl: 'https://lachispasur.cl',
      siteName: 'La Chispa Sur',
    },
  },

  modules: ['@pinia/nuxt'],

  // Tailwind CSS v4 — igual que en el vite.config.ts del proyecto Vue original
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  // Nitro — preset para Docker/Node.js puro (sin serverless)
  nitro: {
    preset: 'node-server',
  },

  // App-level head defaults
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/webp', href: '/logo.webp' },
      ],
    },
  },
})
