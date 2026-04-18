// server/api/posts/[slug].delete.ts — DELETE /api/posts/:id (borrar post)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { getPostBySlugOrId } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!

  try {
    const post = await getPostBySlugOrId(slug)
    if (!post) throw createError({ statusCode: 404, message: 'Post no encontrado' })

    const db = getAdminDb()
    await db.collection('posts').doc(post.id).delete()
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[DELETE /api/posts/:slug]', error)
    throw createError({ statusCode: 500, message: 'Error al borrar el post' })
  }
})
