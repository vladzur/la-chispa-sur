// middleware/auth.ts
// Route guard global — equivalente al router.beforeEach de Vue Router
// Se ejecuta en cliente DESPUÉS de la hidratación
export default defineNuxtRouteMiddleware((to) => {
  // Solo ejecutar en cliente (auth state no disponible en SSR)
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Si el auth aún está cargando, no hacemos nada (el watcher en la página lo maneja)
  if (authStore.loading) return

  const requiresAuth = to.meta.requiresAuth as boolean | undefined
  const requiresAdmin = to.meta.requiresAdmin as boolean | undefined
  const requiresApproved = to.meta.requiresApproved as boolean | undefined
  const guestOnly = to.meta.guestOnly as boolean | undefined

  // Ruta solo para invitados (registro): redirigir si ya está logueado
  if (guestOnly && authStore.user) {
    if (authStore.isPending) return navigateTo('/pendiente')
    return navigateTo('/')
  }

  if (!requiresAuth) return

  // Requiere autenticación
  if (!authStore.user) return navigateTo('/login')

  // Usuario pendiente: solo puede ir a /pendiente
  if (authStore.isPending && to.path !== '/pendiente') {
    return navigateTo('/pendiente')
  }

  // Solo admin
  if (requiresAdmin && !authStore.isAdmin) return navigateTo('/')

  // Admin o editor aprobado
  if (requiresApproved && !authStore.isApproved) return navigateTo('/')
})
