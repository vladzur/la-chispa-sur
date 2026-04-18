// server/api/posts/index.get.ts
// GET /api/posts — Lista de posts publicados (usada por pages/index.vue)
import { getPublishedPosts } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  try {
    const posts = await getPublishedPosts()
    // Cache: 60s en CDN, revalida en background hasta 5 minutos
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return posts
  } catch (error) {
    console.error('[API /posts] Error:', error)
    throw createError({ statusCode: 500, message: 'Error al obtener los artículos' })
  }
})
