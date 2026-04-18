<!-- pages/pendiente.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-light py-12 px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-6">
        <svg class="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold text-text-heading font-sans mb-4">
        Cuenta en revisión
      </h1>
      <p class="text-gray-600 mb-8">
        Tu cuenta está pendiente de aprobación por un administrador.
        Te notificaremos cuando se active tu acceso.
      </p>
      <button
        id="pending-signout-btn"
        class="px-6 py-2 rounded-md bg-primary text-white font-medium hover:bg-secondary transition-colors"
        @click="handleSignOut"
      >
        Cerrar sesión
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth', meta: { requiresAuth: true } })
useSeoMeta({ title: 'Cuenta Pendiente', robots: 'noindex' })

const authStore = useAuthStore()
const router = useRouter()

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/')
}
</script>
