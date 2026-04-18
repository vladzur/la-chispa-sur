// server/api/posts/[slug].patch.ts — PATCH /api/posts/:id (actualizar post)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { getPostBySlugOrId } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const body = await readBody(event)

  try {
    // Buscar el documento primero
    const post = await getPostBySlugOrId(slug)
    if (!post) throw createError({ statusCode: 404, message: 'Post no encontrado' })

    const db = getAdminDb()
    const docRef = db.collection('posts').doc(post.id)

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) updates.content = body.content
    if (body.headerImageUrl !== undefined) updates.headerImageUrl = body.headerImageUrl
    if (body.published !== undefined) updates.published = body.published

    await docRef.update(updates)
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[PATCH /api/posts/:slug]', error)
    throw createError({ statusCode: 500, message: 'Error al actualizar el post' })
  }
})
