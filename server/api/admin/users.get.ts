// server/api/admin/users.get.ts — GET /api/admin/users?role=pending|editor
import { getAdminDb } from '~/server/utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const role = query.role as string

  if (!role || !['pending', 'editor', 'admin'].includes(role)) {
    throw createError({ statusCode: 400, message: 'role debe ser pending, editor o admin' })
  }

  try {
    const db = getAdminDb()
    const snapshot = await db
      .collection('users')
      .where('role', '==', role)
      .get()

    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        uid: d.id,
        name: data.name ?? '',
        email: data.email ?? '',
        role: data.role,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
        approvedAt: data.approvedAt?.toDate?.().toISOString() ?? null,
      }
    })
  } catch (error) {
    console.error('[GET /api/admin/users]', error)
    throw createError({ statusCode: 500, message: 'Error al obtener usuarios' })
  }
})
