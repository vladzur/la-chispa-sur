<template>
  <div class="register-bg">
    <!-- Estado de carga de token -->
    <div v-if="pending" class="register-container">
      <div class="register-card">
        <div class="spinner-wrapper">
          <div class="spinner"></div>
          <p class="loading-text">Verificando enlace de invitación...</p>
        </div>
      </div>
    </div>

    <!-- Token inválido/expirado -->
    <div v-else-if="!validation?.valid" class="register-container">
      <div class="register-card register-card--error">
        <div class="error-icon">🔒</div>
        <h1 class="register-title">Enlace inválido</h1>
        <p class="register-subtitle error-reason">{{ validation?.reason || 'Token no válido' }}</p>
        <NuxtLink to="/" class="btn-secondary">Volver al inicio</NuxtLink>
      </div>
    </div>

    <!-- Formulario de registro -->
    <div v-else class="register-container">
      <div class="register-card">
        <!-- Header -->
        <div class="register-header">
          <div class="register-badge">✉️ Invitación válida</div>
          <h1 class="register-title">Crear cuenta de editor</h1>
          <p class="register-subtitle">
            Tu acceso quedará pendiente de aprobación por el administrador.
          </p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="register-name" class="form-label">Nombre completo</label>
            <input
              id="register-name"
              v-model="name"
              type="text"
              placeholder="Tu nombre"
              required
              autocomplete="name"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="register-email" class="form-label">Correo electrónico</label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              placeholder="tu@correo.com"
              required
              autocomplete="email"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="register-password" class="form-label">Contraseña</label>
            <div class="password-wrapper">
              <input
                id="register-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
                autocomplete="new-password"
                class="form-input"
              />
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="register-confirm-password" class="form-label">Confirmar contraseña</label>
            <input
              id="register-confirm-password"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              required
              class="form-input"
              :class="{ 'form-input--error': confirmPassword && password !== confirmPassword }"
            />
          </div>

          <!-- Mensajes de error/éxito -->
          <div v-if="error" class="alert alert--error">{{ error }}</div>

          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <span v-if="loading">Creando cuenta...</span>
            <span v-else>Crear cuenta</span>
          </button>
        </form>

        <p class="register-footer">
          ¿Ya tienes cuenta?
          <NuxtLink to="/login" class="link">Inicia sesión</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createUserWithEmailAndPassword } from 'firebase/auth'

definePageMeta({ layout: false })

useSeoMeta({ title: 'Crear cuenta de editor', robots: 'noindex' })

const route = useRoute()
const router = useRouter()

const token = route.params.token as string

// Validar el token en SSR para que no renderice el formulario si el enlace es inválido
const { data: validation, pending } = await useAsyncData(
  `token-${token}`,
  () => $fetch<{ valid: boolean; reason?: string }>(`/api/admin/invite/${token}`)
)

// Estado del formulario
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const isFormValid = computed(() =>
  name.value.trim().length >= 2 &&
  email.value.includes('@') &&
  password.value.length >= 8 &&
  password.value === confirmPassword.value
)

const handleRegister = async () => {
  if (!isFormValid.value) return
  loading.value = true
  error.value = ''

  try {
    const { $firebaseAuth } = useNuxtApp() as any
    
    // 1. Crear usuario en Firebase Auth (cliente)
    const userCredential = await createUserWithEmailAndPassword($firebaseAuth, email.value, password.value)
    const uid = userCredential.user.uid

    // 2. Transacción en el servidor para crear el documento y quemar el token
    await $fetch(`/api/admin/invite/${token}`, {
      method: 'POST',
      body: {
        uid,
        name: name.value.trim(),
        email: email.value.toLowerCase().trim()
      }
    })

    // 3. Redirigir a pantalla de espera
    router.push('/pendiente')

  } catch (err: any) {
    console.error('Error al registrarse:', err)
    
    // Si la API falla pero el usuario se creó en Auth, deberíamos capturarlo. 
    // Idealmente podríamos revertir o manejarlo, pero mostramos un mensaje.
    if (err?.data?.message) {
      error.value = err.data.message
    } else if (err.code === 'auth/email-already-in-use') {
      error.value = 'Este correo electrónico ya tiene una cuenta registrada.'
    } else if (err.code === 'auth/weak-password') {
      error.value = 'La contraseña es demasiado débil. Usa al menos 8 caracteres.'
    } else if (err.code === 'auth/invalid-email') {
      error.value = 'El correo electrónico no es válido.'
    } else {
      error.value = 'Ocurrió un error al crear la cuenta. Por favor intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Estilos idénticos al original ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.register-bg { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1f35 100%); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
.register-container { width: 100%; max-width: 440px; }
.register-card { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 2.5rem 2rem; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08); }
.register-card--error { text-align: center; padding: 3rem 2rem; }

.spinner-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem 0; }
.spinner { width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.loading-text { color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.register-header { text-align: center; margin-bottom: 2rem; }
.register-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; font-size: 0.75rem; font-weight: 600; padding: 0.35rem 0.85rem; border-radius: 100px; margin-bottom: 1rem; letter-spacing: 0.05em; text-transform: uppercase; }
.error-icon { font-size: 3rem; margin-bottom: 1rem; }
.register-title { font-size: 1.65rem; font-weight: 700; color: #f1f5f9; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
.register-subtitle { color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; line-height: 1.6; margin: 0; }
.error-reason { color: #fca5a5; margin-bottom: 2rem; }

.register-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-label { color: rgba(255, 255, 255, 0.7); font-size: 0.82rem; font-weight: 500; letter-spacing: 0.02em; }
.form-input { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; color: #f1f5f9; font-size: 0.95rem; padding: 0.75rem 1rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; outline: none; box-sizing: border-box; font-family: 'Inter', sans-serif; }
.form-input::placeholder { color: rgba(255, 255, 255, 0.3); }
.form-input:focus { border-color: #6366f1; background: rgba(99, 102, 241, 0.08); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.form-input--error { border-color: #f87171 !important; box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15); }

.password-wrapper { position: relative; }
.password-wrapper .form-input { padding-right: 3rem; }
.password-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1; opacity: 0.7; transition: opacity 0.2s; }
.password-toggle:hover { opacity: 1; }

.alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; }
.alert--error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }

.btn-primary { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: 'Inter', sans-serif; margin-top: 0.25rem; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

.btn-secondary { display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; color: rgba(255, 255, 255, 0.8); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
.btn-secondary:hover { background: rgba(255, 255, 255, 0.12); color: white; }

.register-footer { text-align: center; margin-top: 1.5rem; color: rgba(255, 255, 255, 0.4); font-size: 0.85rem; }
.link { color: #818cf8; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.link:hover { color: #a5b4fc; }
</style>
