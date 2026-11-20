// server/api/posts/category/[category].get.ts
import { getPostsByCategory } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const category = getRouterParam(event, 'category')

  if (!category) {
    throw createError({ statusCode: 400, message: 'Categoría requerida' })
  }

  // Tope opcional por query; el servicio acota igual a PAGE_MAX
  const { limit } = getQuery(event)
  const parsedLimit = typeof limit === 'string' ? Number(limit) : NaN

  try {
    const posts = await getPostsByCategory(
      category,
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    )
    // Cache: 60s en CDN
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return posts
  } catch (error) {
    console.error(`[API /posts/category/${category}] Error:`, error)
    throw createError({ statusCode: 500, message: 'Error al obtener los artículos de esta categoría' })
  }
})
