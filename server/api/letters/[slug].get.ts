// server/api/letters/[slug].get.ts
// GET /api/letters/:slug — Carta individual (usada por pages/cartas-al-director/[slug].vue)
import { getLetterBySlugOrId } from '~/server/utils/letterService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requerido' })
  }

  try {
    const letter = await getLetterBySlugOrId(slug)

    if (!letter) {
      throw createError({ statusCode: 404, message: 'Carta no encontrada' })
    }

    // Cartas no publicadas o programadas a futuro: solo devolver a admins y editores
    const isHidden = letter.published === false || new Date(letter.publishDate) > new Date()
    if (isHidden) {
      const user = event.context.user
      if (!user || (!user.isAdmin && !user.isEditor)) {
        throw createError({ statusCode: 404, message: 'Carta no encontrada' })
      }
    }

    // Cache: 60s en CDN, stale-while-revalidate para no bloquear al usuario
    setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return letter
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error(`[API /letters/${slug}] Error:`, error)
    throw createError({ statusCode: 500, message: 'Error al obtener la carta' })
  }
})
