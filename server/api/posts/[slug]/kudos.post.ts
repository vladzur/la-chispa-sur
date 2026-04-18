// server/api/posts/[slug]/kudos.post.ts
// POST /api/posts/:slug/kudos — Incrementar kudos de un post (llamado por KudosButton.vue)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'ID de post requerido' })
  }

  try {
    const db = getAdminDb()

    // Buscar por slug primero, luego por ID
    let docRef: FirebaseFirestore.DocumentReference | null = null

    const slugQuery = await db
      .collection('posts')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (!slugQuery.empty) {
      docRef = slugQuery.docs[0].ref
    } else {
      // Intentar como ID directo
      const direct = db.collection('posts').doc(slug)
      const snap = await direct.get()
      if (snap.exists) docRef = direct
    }

    if (!docRef) {
      throw createError({ statusCode: 404, message: 'Post no encontrado' })
    }

    await docRef.update({ kudosCount: FieldValue.increment(1) })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error(`[API kudos] Error:`, error)
    throw createError({ statusCode: 500, message: 'Error al guardar kudos' })
  }
})
