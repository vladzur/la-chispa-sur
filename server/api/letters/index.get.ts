// server/api/letters/index.get.ts
// GET /api/letters — Lista de cartas publicadas (usada por pages/cartas-al-director/index.vue)
import { getPublishedLetters } from '~/server/utils/letterService'

export default defineEventHandler(async (event) => {
  try {
    const letters = await getPublishedLetters()
    // Cache: 60s en CDN, revalida en background hasta 5 minutos
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return letters
  } catch (error) {
    console.error('[API /letters] Error:', error)
    throw createError({ statusCode: 500, message: 'Error al obtener las cartas' })
  }
})
