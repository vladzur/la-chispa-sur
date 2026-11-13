<!-- pages/admin/carta/[[id]].vue — Editor de cartas al director (nueva y edición) -->
<!-- [[id]] = parámetro opcional: /admin/carta (nueva) o /admin/carta/:id (editar) -->
<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold font-sans text-text-heading">
        {{ isEditing ? 'Editar Carta' : 'Redactar Carta al Director' }}
      </h1>
      <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-800 font-medium transition-colors">← Volver</NuxtLink>
    </div>

    <form @submit.prevent="saveLetter" class="space-y-6">
      <!-- Título -->
      <div>
        <label for="letter-title" class="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          id="letter-title"
          v-model="title"
          type="text"
          required
          class="w-full text-2xl font-bold font-sans px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none"
          placeholder="El título de la carta..."
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Remitente -->
        <div>
          <label for="letter-sender-name" class="block text-sm font-medium text-gray-700 mb-1">Remitente</label>
          <input
            id="letter-sender-name"
            v-model="senderName"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none"
            placeholder="Nombre de quien envía la carta"
          />
        </div>

        <!-- Ciudad / Localidad -->
        <div>
          <label for="letter-sender-city" class="block text-sm font-medium text-gray-700 mb-1">Ciudad / Localidad</label>
          <input
            id="letter-sender-city"
            v-model="senderCity"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none"
            placeholder="Ej: Valdivia"
          />
        </div>
      </div>

      <!-- Fecha de publicación programada -->
      <div>
        <label for="letter-publish-date" class="block text-sm font-medium text-gray-700 mb-1">Fecha de publicación</label>
        <input
          id="letter-publish-date"
          v-model="publishDateInput"
          type="datetime-local"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-primary"
        />
        <p class="text-xs text-gray-500 mt-1">Si se deja vacío, la carta se publica de inmediato.</p>
      </div>

      <!-- Editor Tiptap WYSIWYG -->
      <AdminRichTextEditor v-model="content" placeholder="Transcribe aquí el contenido de la carta..." />

      <!-- Footer del formulario -->
      <div class="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4 sm:mb-0 cursor-pointer">
          <input v-model="published" type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5" />
          <span>Publicar (visible para todos)</span>
        </label>

        <button
          id="letter-save-btn"
          type="submit"
          :disabled="saving"
          class="w-full sm:w-auto bg-primary text-white font-medium py-2 px-8 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar Carta' : 'Guardar Carta') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Letter } from '~/types/letter'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  meta: { requiresAuth: true, requiresApproved: true },
})

useSeoMeta({ title: 'Editor de cartas', robots: 'noindex' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.id)
const letterId = computed(() => route.params.id as string | undefined)

const title = ref('')
const content = ref('')
const senderName = ref('')
const senderCity = ref('')
const saving = ref(false)
const published = ref(true)
const publishDateInput = ref('')  // formato datetime-local (YYYY-MM-DDTHH:mm) para el input

// ── Helpers para fecha de publicación ──────────────────────────────────────────
/** Convierte una fecha ISO a formato datetime-local, usando la hora local del navegador. */
const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  // getFullYear, getMonth, getDate, getHours y getMinutes ya retornan valores en hora local.
  // No es necesario aplicar getTimezoneOffset manualmente.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Cargar carta existente ────────────────────────────────────────────────────
onMounted(async () => {
  if (letterId.value) {
    saving.value = true
    try {
      const letter = await useAuthFetch<Letter>(`/api/letters/${letterId.value}`)
      title.value = letter.title
      senderName.value = letter.senderName
      senderCity.value = letter.senderCity
      published.value = letter.published !== false
      if (letter.publishDate) publishDateInput.value = toDatetimeLocal(letter.publishDate)
      content.value = letter.content
    } finally {
      saving.value = false
    }
  }
})

// ── Guardar ───────────────────────────────────────────────────────────────────
const saveLetter = async () => {
  saving.value = true

  try {
    const letterData: Record<string, unknown> = {
      title: title.value,
      content: content.value,
      senderName: senderName.value,
      senderCity: senderCity.value,
      published: published.value,
    }

    // Solo incluir publishDate si el usuario seleccionó una fecha explícitamente.
    // Si está vacío, se omite para que el servidor no sobrescriba el valor existente.
    if (publishDateInput.value) {
      letterData.publishDate = new Date(publishDateInput.value).toISOString()
    }

    if (isEditing.value && letterId.value) {
      await useAuthFetch(`/api/letters/${letterId.value}`, { method: 'PATCH', body: letterData })
    } else {
      await useAuthFetch('/api/letters', {
        method: 'POST',
        body: {
          ...letterData,
          authorId: authStore.user?.uid || 'unknown',
          authorName: authStore.userName || authStore.user?.email || 'Redactor',
        },
      })
    }

    router.push('/admin')
  } catch (error) {
    console.error('Error saving letter:', error)
    alert('Error al guardar la carta.')
  } finally {
    saving.value = false
  }
}
</script>
