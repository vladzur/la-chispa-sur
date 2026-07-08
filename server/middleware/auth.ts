import { getAdminAuth, getAdminDb } from '../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]
  const method = event.method

  // Determinar si la ruta es una API
  if (!path.startsWith('/api/')) return

  // Definir reglas de protección
  let requiresAuth = false
  let requiresAdmin = false

  // ── RUTAS DE NOTICIAS (POSTS) ──
  if (path.startsWith('/api/posts')) {
    // /api/posts y /api/posts/[slug] con GET son públicos
    // /api/posts/all es protegido
    if (path.includes('/all')) {
      requiresAuth = true
    } else if (method !== 'GET' && !path.endsWith('/kudos')) {
      requiresAuth = true // POST, PATCH, DELETE requieren auth, excepto kudos
    }
  }

  // ── RUTAS DE ADMIN ──
  if (path.startsWith('/api/admin/')) {
    // Excepción: las rutas con tokens de invitación son públicas
    if (path.startsWith('/api/admin/invite/') && path.split('/').length > 4) {
      // /api/admin/invite/[token] es público para GET y POST
      requiresAuth = false
    } else if (path === '/api/admin/upload-image') {
      // Subir imágenes requiere auth normal (editor o admin)
      requiresAuth = true
    } else {
      // Cualquier otra ruta en /api/admin requiere permisos de ADMIN
      // Ej: /api/admin/users, /api/admin/editors, /api/admin/invite (POST sin token)
      requiresAuth = true
      requiresAdmin = true
    }
  }

  // ── VERIFICACIÓN DEL TOKEN ──
  const authHeader = getHeader(event, 'authorization')

  if (!requiresAuth && !authHeader) return

  if (requiresAuth && (!authHeader || !authHeader.startsWith('Bearer '))) {
    throw createError({ statusCode: 401, message: 'No Autorizado: Se requiere token de autenticación' })
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]

    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token)

      const isAdmin = decodedToken.admin === true
      const isEditor = decodedToken.editor === true

      // Validar estado de la cuenta (debe estar aprobado)
      if (requiresAuth && !isAdmin && !isEditor) {
        throw createError({ statusCode: 403, message: 'Prohibido: Cuenta pendiente o sin permisos' })
      }

      // Validar privilegios de administrador si la ruta lo requiere
      if (requiresAdmin && !isAdmin) {
        throw createError({ statusCode: 403, message: 'Prohibido: Privilegios de administrador requeridos' })
      }

      // Inyectar el usuario en el contexto para uso posterior (opcional)
      event.context.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAdmin,
        isEditor
      }
    } catch (error: any) {
      console.error('[API AUTH ERROR]', error.message)
      if (requiresAuth) {
        if (error.code?.startsWith('auth/')) {
          throw createError({ statusCode: 401, message: 'No Autorizado: Token inválido o expirado' })
        }
        if (error.statusCode) throw error
        throw createError({ statusCode: 500, message: 'Error interno en la verificación de seguridad' })
      }
    }
  }
})
