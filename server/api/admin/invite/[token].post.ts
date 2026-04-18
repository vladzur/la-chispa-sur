// server/api/admin/invite/[token].post.ts
// Redime un token de invitación y crea el registro inicial del usuario pendiente
import { getAdminDb } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const body = await readBody(event)
  const { uid, name, email } = body
  
  if (!uid || !name || !email) {
    throw createError({ statusCode: 400, message: 'Faltan datos (uid, name, email)' })
  }
  
  const db = getAdminDb()
  
  try {
    // Usamos una transacción para garantizar que el token no se use dos veces en paralelo
    await db.runTransaction(async (t) => {
      const tokenRef = db.collection('inviteTokens').doc(token)
      const tokenDoc = await t.get(tokenRef)
      
      if (!tokenDoc.exists) {
        throw new Error('Token de invitación inválido')
      }
      
      const data = tokenDoc.data()!
      if (data.used) {
        throw new Error('Este enlace de invitación ya fue utilizado')
      }
      
      if (new Date() > data.expiresAt.toDate()) {
        throw new Error('Este enlace de invitación ha expirado')
      }
      
      // Crear documento del usuario con rol 'pending'
      const userRef = db.collection('users').doc(uid)
      t.set(userRef, {
        name,
        email,
        role: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      })
      
      // Marcar token como usado
      t.update(tokenRef, {
        used: true,
        usedBy: uid,
        usedAt: FieldValue.serverTimestamp(),
      })
    })
    
    return { success: true }
  } catch (err: any) {
    console.error('[POST /api/admin/invite/:token]', err)
    throw createError({ statusCode: 400, message: err.message || 'Error al procesar el registro' })
  }
})
