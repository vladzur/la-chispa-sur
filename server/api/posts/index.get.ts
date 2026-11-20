// server/api/posts/index.get.ts
// GET /api/posts — Lista paginada de posts publicados (usada por pages/index.vue)
// Query: ?limit=12&cursor=<ISO publishDate>&category=<nombre>
import { getPublishedPostsPage } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const { limit, cursor, category } = getQuery(event)

  try {
    const page = await getPublishedPostsPage({
      limit: Number(limit) || undefined,
      cursor: typeof cursor === 'string' ? cursor : undefined,
      category: typeof category === 'string' ? category : undefined,
    })
    // Cache: 60s en CDN, revalida en background hasta 5 minutos
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return page
  } catch (error) {
    console.error('[API /posts] Error:', error)
    throw createError({ statusCode: 500, message: 'Error al obtener los artículos' })
  }
})
