// server/api/admin/editors.post.ts
// POST /api/admin/editors — Aprobar, rechazar, revocar o eliminar un editor
// Reemplaza las Cloud Functions approveEditor y revokeEditor
import { getAdminDb, getAdminAuth } from '~/server/utils/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { uid, action } = body as { uid: string; action: 'approve' | 'reject' | 'revoke' | 'delete' }

  if (!uid || !action) {
    throw createError({ statusCode: 400, message: 'uid y action son requeridos' })
  }

  const db = getAdminDb()
  const auth = getAdminAuth()

  try {
    switch (action) {
      case 'approve': {
        await db.collection('users').doc(uid).update({
          role: 'editor',
          approvedAt: FieldValue.serverTimestamp(),
        })
        break
      }
      case 'reject': {
        // Eliminar el documento del usuario y su cuenta de Auth
        await db.collection('users').doc(uid).delete()
        await auth.deleteUser(uid)
        break
      }
      case 'revoke': {
        await db.collection('users').doc(uid).update({ role: 'pending' })
        break
      }
      case 'delete': {
        await db.collection('users').doc(uid).delete()
        await auth.deleteUser(uid)
        break
      }
      default:
        throw createError({ statusCode: 400, message: `Acción desconocida: ${action}` })
    }

    return { success: true, message: `Acción '${action}' aplicada al usuario ${uid}` }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[POST /api/admin/editors]', error)
    throw createError({ statusCode: 500, message: 'Error al procesar la acción' })
  }
})
