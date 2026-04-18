// server/api/admin/invite/[token].get.ts
// Valida si un token de invitación es válido y no ha expirado
import { getAdminDb } from '~/server/utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const db = getAdminDb()
  
  try {
    const tokenDoc = await db.collection('inviteTokens').doc(token).get()
    
    if (!tokenDoc.exists) {
      return { valid: false, reason: 'Token de invitación inválido.' }
    }
    
    const data = tokenDoc.data()!
    if (data.used) {
      return { valid: false, reason: 'Este enlace de invitación ya fue utilizado.' }
    }
    
    const expiresAt = data.expiresAt.toDate()
    if (new Date() > expiresAt) {
      return { valid: false, reason: 'Este enlace de invitación ha expirado.' }
    }
    
    return { valid: true }
  } catch (error) {
    console.error('[GET /api/admin/invite/:token]', error)
    return { valid: false, reason: 'Error interno al validar el token.' }
  }
})
