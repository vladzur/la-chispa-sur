// server/api/posts/index.post.ts — POST /api/posts (crear nuevo post)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { slugify } from '~/server/utils/slugify'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title || !body?.content) {
    throw createError({ statusCode: 400, message: 'title y content son requeridos' })
  }

  try {
    const db = getAdminDb()
    const slug = await generateUniqueSlug(db, body.title)

    const docRef = await db.collection('posts').add({
      title: body.title,
      content: body.content,
      headerImageUrl: body.headerImageUrl || '',
      authorId: body.authorId || 'unknown',
      authorName: body.authorName || '',
      slug,
      published: body.published ?? true,
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

const generateUniqueSlug = async (db: FirebaseFirestore.Firestore, title: string): Promise<string> => {
  const base = slugify(title)
  let candidate = base
  let i = 1
  while (true) {
    const existing = await db.collection('posts').where('slug', '==', candidate).limit(1).get()
    if (existing.empty) return candidate
    candidate = `${base}-${i++}`
  }
}
