// server/api/letters/all.get.ts — GET /api/letters/all (todas las cartas, incl. borradores — solo admin/editores)
import { getAllLetters } from '~/server/utils/letterService'

export default defineEventHandler(async (_event) => {
  try {
    return await getAllLetters()
  } catch (error) {
    console.error('[GET /api/letters/all]', error)
    throw createError({ statusCode: 500, message: 'Error al obtener las cartas' })
  }
})
