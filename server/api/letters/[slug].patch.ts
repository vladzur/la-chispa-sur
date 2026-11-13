// server/api/letters/[slug].patch.ts — PATCH /api/letters/:slug (actualizar carta)
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { getLetterBySlugOrId } from '~/server/utils/letterService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const body = await readBody(event)

  try {
    // Buscar el documento primero
    const letter = await getLetterBySlugOrId(slug)
    if (!letter) throw createError({ statusCode: 404, message: 'Carta no encontrada' })

    const db = getAdminDb()
    const docRef = db.collection('letters').doc(letter.id)

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) updates.content = body.content
    if (body.senderName !== undefined) updates.senderName = body.senderName
    if (body.senderCity !== undefined) updates.senderCity = body.senderCity
    if (body.published !== undefined) updates.published = body.published
    // Solo actualizar publishDate si el cliente envía un valor no-vacío.
    // Si viene undefined o string vacío, se preserva el valor existente en Firestore.
    if (body.publishDate) updates.publishDate = new Date(body.publishDate as string)

    await docRef.update(updates)
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[PATCH /api/letters/:slug]', error)
    throw createError({ statusCode: 500, message: 'Error al actualizar la carta' })
  }
})
