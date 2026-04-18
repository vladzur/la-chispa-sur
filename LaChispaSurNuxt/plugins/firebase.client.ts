// plugins/firebase.client.ts
// El sufijo `.client.ts` garantiza que este plugin SOLO se ejecute en el navegador.
// Firebase Auth y Analytics no funcionan en Node.js server-side.
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Evitar doble inicialización en HMR
  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          apiKey: config.public.firebaseApiKey,
          authDomain: config.public.firebaseAuthDomain,
          projectId: config.public.firebaseProjectId,
          storageBucket: config.public.firebaseStorageBucket,
          messagingSenderId: config.public.firebaseMessagingSenderId,
          appId: config.public.firebaseAppId,
          measurementId: config.public.firebaseMeasurementId,
        })

  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)

  // Analytics solo si el navegador lo soporta (respeta privacy settings)
  let analytics: ReturnType<typeof getAnalytics> | null = null
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app)
  })

  return {
    provide: {
      firebaseAuth: auth,
      firebaseDb: db,
      firebaseStorage: storage,
      getAnalytics: () => analytics,
    },
  }
})
