// server/api/letters/index.post.ts — POST /api/letters (crear nueva carta)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { generateUniqueSlug } from '~/server/utils/slugify'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title || !body?.content || !body?.senderName || !body?.senderCity) {
    throw createError({ statusCode: 400, message: 'title, content, senderName y senderCity son requeridos' })
  }

  try {
    const db = getAdminDb()
    const slug = await generateUniqueSlug(db, 'letters', body.title)

    const docRef = await db.collection('letters').add({
      title: body.title,
      content: body.content,
      senderName: body.senderName,
      senderCity: body.senderCity,
      authorId: body.authorId || 'unknown',
      authorName: body.authorName || '',
      slug,
      published: body.published ?? true,
      publishDate: body.publishDate || FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { id: docRef.id, slug }
  } catch (error) {
    console.error('[POST /api/letters]', error)
    throw createError({ statusCode: 500, message: 'Error al crear la carta' })
  }
})
