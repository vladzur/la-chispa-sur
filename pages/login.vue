<!-- pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-light py-12 px-4">
    <!-- Contenido copiado de src/views/LoginView.vue -->
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-text-heading font-sans">
          Iniciar Sesión
        </h1>
        <p class="mt-2 text-sm text-gray-600">Panel de editores — La Chispa Sur</p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="login-email" class="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <p v-if="error" class="text-accent text-sm text-center">{{ error }}</p>

        <button
          id="login-submit-btn"
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none disabled:opacity-50 transition-colors"
        >
          {{ loading ? 'Iniciando...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword } from 'firebase/auth'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Iniciar Sesión', robots: 'noindex' })

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const { $firebaseAuth } = useNuxtApp() as any
    await signInWithEmailAndPassword($firebaseAuth, email.value, password.value)
    router.push('/admin')
  } catch (err: any) {
    error.value = 'Credenciales incorrectas. Verifica tu correo y contraseña.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>
