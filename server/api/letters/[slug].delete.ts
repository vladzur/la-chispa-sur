// server/api/letters/[slug].delete.ts — DELETE /api/letters/:slug (borrar carta)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { getLetterBySlugOrId } from '~/server/utils/letterService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!

  try {
    const letter = await getLetterBySlugOrId(slug)
    if (!letter) throw createError({ statusCode: 404, message: 'Carta no encontrada' })

    const db = getAdminDb()
    await db.collection('letters').doc(letter.id).delete()
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[DELETE /api/letters/:slug]', error)
    throw createError({ statusCode: 500, message: 'Error al borrar la carta' })
  }
})
