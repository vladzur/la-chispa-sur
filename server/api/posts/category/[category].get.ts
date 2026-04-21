// server/api/posts/category/[category].get.ts
import { getPostsByCategory } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const category = getRouterParam(event, 'category')

  if (!category) {
    throw createError({ statusCode: 400, message: 'Categoría requerida' })
  }

  try {
    const posts = await getPostsByCategory(category)
    // Cache: 60s en CDN
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return posts
  } catch (error) {
    console.error(`[API /posts/category/${category}] Error:`, error)
    throw createError({ statusCode: 500, message: 'Error al obtener los artículos de esta categoría' })
  }
})
