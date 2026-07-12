// scripts/backfill-publishDate.mjs
// Migración única: asigna publishDate = createdAt a todos los posts que no tengan publishDate.
//
// Uso: node scripts/backfill-publishDate.mjs
//
// Requiere las mismas variables de entorno que el servidor:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// O un archivo .env en la raíz del proyecto.

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Cargar variables de entorno desde .env (si existe) ────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Faltan variables de entorno: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
  process.exit(1)
}

// ── Inicializar Firebase Admin ────────────────────────────────────────────────
const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
})

const db = getFirestore(app)

// ── Migrar posts ──────────────────────────────────────────────────────────────
async function backfill() {
  console.log('🔍 Buscando posts sin publishDate...')

  const snapshot = await db.collection('posts').get()

  if (snapshot.empty) {
    console.log('✅ No hay posts en la colección. Nada que migrar.')
    return
  }

  let updated = 0
  let skipped = 0
  const batch = db.batch()
  let batchCount = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()

    // Si ya tiene publishDate, saltar
    if (data.publishDate) {
      skipped++
      continue
    }

    // Usar createdAt como publishDate. Si no existe (raro), usar timestamp actual.
    const publishDate = data.createdAt instanceof Timestamp
      ? data.createdAt
      : Timestamp.now()

    batch.update(doc.ref, { publishDate })
    updated++
    batchCount++

    // Firestore batch tiene límite de 500 operaciones
    if (batchCount >= 500) {
      await batch.commit()
      console.log(`   ✔ Commit intermedio: ${updated} posts migrados hasta ahora...`)
      batchCount = 0
    }
  }

  // Commit del batch final
  if (batchCount > 0) {
    await batch.commit()
  }

  console.log(`\n🎉 Migración completada:`)
  console.log(`   ✅ ${updated} posts migrados (publishDate = createdAt)`)
  console.log(`   ⏭️  ${skipped} posts ya tenían publishDate`)
  console.log(`   📦 Total de posts: ${snapshot.size}`)
}

backfill()
  .then(() => {
    console.log('🏁 Script finalizado exitosamente.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error durante la migración:', err)
    process.exit(1)
  })
