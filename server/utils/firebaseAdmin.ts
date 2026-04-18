// server/utils/firebaseAdmin.ts
// Admin SDK singleton — solo se ejecuta en el servidor (Nitro)
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getStorage, type Storage } from 'firebase-admin/storage'

let _app: App | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null

const getAdminApp = (): App => {
  if (_app) return _app
  if (getApps().length > 0) {
    _app = getApps()[0]
    return _app
  }

  const config = useRuntimeConfig()

  _app = initializeApp({
    credential: cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      // Las nuevlines escapadas de los env vars se deben restaurar
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
    }),
  })

  return _app
}

export const getAdminDb = (): Firestore => {
  if (!_db) _db = getFirestore(getAdminApp())
  return _db
}

export const getAdminAuth = (): Auth => {
  if (!_auth) _auth = getAuth(getAdminApp())
  return _auth
}

let _storage: Storage | null = null

export const getAdminStorage = (): Storage => {
  if (!_storage) _storage = getStorage(getAdminApp())
  return _storage
}
