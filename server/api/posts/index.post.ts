// server/api/posts/index.post.ts — POST /api/posts (crear nuevo post)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { generateUniqueSlug } from '~/server/utils/slugify'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title || !body?.content) {
    throw createError({ statusCode: 400, message: 'title y content son requeridos' })
  }

  try {
    const db = getAdminDb()
    const slug = await generateUniqueSlug(db, 'posts', body.title)

    const docRef = await db.collection('posts').add({
      title: body.title,
      content: body.content,
      headerImageUrl: body.headerImageUrl || '',
      headerImageAlt: body.headerImageAlt || null,
      authorId: body.authorId || 'unknown',
      authorName: body.authorName || '',
      slug,
      published: body.published ?? true,
      publishDate: body.publishDate || FieldValue.serverTimestamp(),
      category: body.category || 'Actualidad',
      isFeatured: body.isFeatured ?? false,
      kudosCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { id: docRef.id, slug }
  } catch (error) {
    console.error('[POST /api/posts]', error)
    throw createError({ statusCode: 500, message: 'Error al crear el post' })
  }
})
