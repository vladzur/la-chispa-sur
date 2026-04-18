// server/api/admin/invite.post.ts — POST /api/admin/invite
// Genera un token de invitación (72h) para registrar nuevos editores
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

const generateTokenId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export default defineEventHandler(async (event) => {
  // TODO: verificar que el usuario que llama es admin (via cookie de sesión)
  // Por ahora confía en que el middleware de cliente ya protegió la ruta

  try {
    const db = getAdminDb()
    const token = generateTokenId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000)

    await db.collection('inviteTokens').doc(token).set({
      token,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
    })

    return { token }
  } catch (error) {
    console.error('[POST /api/admin/invite]', error)
    throw createError({ statusCode: 500, message: 'Error al generar el token de invitación' })
  }
})
