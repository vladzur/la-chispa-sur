// server/api/posts/[slug].get.ts
// GET /api/posts/:slug — Post individual (usada por pages/post/[slug].vue)
import { getPostBySlugOrId } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requerido' })
  }

  try {
    const post = await getPostBySlugOrId(slug)

    if (!post) {
      throw createError({ statusCode: 404, message: 'Artículo no encontrado' })
    }

    // Posts no publicados: solo devolver a admins (verificado via cookie/sesión en el futuro)
    // Por ahora los posts no publicados están protegidos por Firestore Rules en el cliente
    if (post.published === false) {
      throw createError({ statusCode: 404, message: 'Artículo no encontrado' })
    }

    // Cache: 60s en CDN, stale-while-revalidate para no bloquear al usuario
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return post
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error(`[API /posts/${slug}] Error:`, error)
    throw createError({ statusCode: 500, message: 'Error al obtener el artículo' })
  }
})
