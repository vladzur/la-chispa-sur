// server/api/posts/all.get.ts — GET /api/posts/all (todos los posts, incl. borradores — solo admin)
import { getAllPosts } from '~/server/utils/postService'

export default defineEventHandler(async (_event) => {
  try {
    return await getAllPosts()
  } catch (error) {
    console.error('[GET /api/posts/all]', error)
    throw createError({ statusCode: 500, message: 'Error al obtener los posts' })
  }
})
