<!-- pages/admin/editor/[[id]].vue — Editor de noticias (nuevo y edición) -->
<!-- [[id]] = parámetro opcional: /admin/editor (nuevo) o /admin/editor/:id (editar) -->
<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold font-sans text-text-heading">
        {{ isEditing ? 'Editar Noticia' : 'Redactar Noticia' }}
      </h1>
      <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-800 font-medium transition-colors">← Volver</NuxtLink>
    </div>

    <form @submit.prevent="savePost" class="space-y-6">
      <!-- Título -->
      <div>
        <label for="editor-title" class="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          id="editor-title"
          v-model="title"
          type="text"
          required
          class="w-full text-2xl font-bold font-sans px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none"
          placeholder="El titular principal de la noticia..."
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Categoría -->
        <div>
          <label for="editor-category" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            id="editor-category"
            v-model="category"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none bg-white"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Destacado -->
        <div class="flex items-end pb-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input v-model="isFeatured" type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5" />
            <span>Artículo Destacado (aparecerá al inicio)</span>
          </label>
        </div>
      </div>

      <!-- Fecha de publicación programada -->
      <div>
        <label for="editor-publish-date" class="block text-sm font-medium text-gray-700 mb-1">Fecha de publicación</label>
        <input
          id="editor-publish-date"
          v-model="publishDateInput"
          type="datetime-local"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-primary"
        />
        <p class="text-xs text-gray-500 mt-1">Si se deja vacío, la noticia se publica de inmediato.</p>
      </div>

      <!-- Imagen de cabecera -->
      <div>
        <label for="editor-image" class="block text-sm font-medium text-gray-700 mb-1">Imagen de Cabecera</label>
        <input
          id="editor-image"
          type="file"
          @change="handleImageChange"
          accept="image/*"
          class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:opacity-90 transition-colors"
        />
        <div v-if="localImagePreview || headerImageUrl" class="mt-4 h-48 w-full relative rounded overflow-hidden">
          <img :src="localImagePreview || headerImageUrl" class="object-cover w-full h-full" alt="Preview" />
          <button
            type="button"
            @click="removeImage"
            class="absolute top-2 right-2 bg-red-600 text-white rounded-md px-2 py-1 text-xs opacity-80 hover:opacity-100"
          >
            Quitar
          </button>
        </div>
        <!-- Alt text descriptivo para SEO y accesibilidad -->
        <div class="mt-2">
          <label for="editor-image-alt" class="block text-sm font-medium text-gray-700 mb-1">Texto alternativo (alt) — breve descripción de la imagen</label>
          <input
            id="editor-image-alt"
            v-model="headerImageAlt"
            type="text"
            placeholder="Ej: Manifestación en el Palacio de La Moneda"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      <!-- Editor Tiptap WYSIWYG -->
      <AdminRichTextEditor v-model="content" placeholder="Empieza a escribir la noticia aquí..." />

      <!-- Footer del formulario -->
      <div class="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4 sm:mb-0 cursor-pointer">
          <input v-model="published" type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5" />
          <span>Publicar (visible para todos)</span>
        </label>

        <button
          id="editor-save-btn"
          type="submit"
          :disabled="saving"
          class="w-full sm:w-auto bg-primary text-white font-medium py-2 px-8 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar Noticia' : 'Guardar Noticia') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  meta: { requiresAuth: true, requiresApproved: true },
})

useSeoMeta({ title: 'Editor de noticias', robots: 'noindex' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.id)
const postId = computed(() => route.params.id as string | undefined)

const title = ref('')
const content = ref('')
const headerImageUrl = ref('')
const headerImageAlt = ref('')
const localImagePreview = ref('')
const fileToUpload = ref<File | null>(null)
const saving = ref(false)
const published = ref(true)
const publishDateInput = ref('')  // formato datetime-local (YYYY-MM-DDTHH:mm) para el input
const isFeatured = ref(false)
const category = ref<string>(DEFAULT_CATEGORY)

// Categorías oficiales del sitio (fuente única: utils/categories.ts)
const categories = NEWS_CATEGORIES

// ── Helpers para fecha de publicación ──────────────────────────────────────────
/** Convierte una fecha ISO a formato datetime-local, usando la hora local del navegador. */
const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  // getFullYear, getMonth, getDate, getHours y getMinutes ya retornan valores en hora local.
  // No es necesario aplicar getTimezoneOffset manualmente.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Cargar post existente ─────────────────────────────────────────────────────
onMounted(async () => {
  if (postId.value) {
    saving.value = true
    try {
      const post = await useAuthFetch<Post>(`/api/posts/${postId.value}`)
      title.value = post.title
      headerImageUrl.value = post.headerImageUrl
      headerImageAlt.value = post.headerImageAlt || ''
      published.value = post.published !== false
      isFeatured.value = post.isFeatured || false
      category.value = post.category || DEFAULT_CATEGORY
      if (post.publishDate) publishDateInput.value = toDatetimeLocal(post.publishDate)
      content.value = post.content
    } finally {
      saving.value = false
    }
  }
})

onBeforeUnmount(() => {
  if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value)
})

// ── Imagen ────────────────────────────────────────────────────────────────────
const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    fileToUpload.value = target.files[0]
    if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value)
    localImagePreview.value = URL.createObjectURL(fileToUpload.value)
  }
}

const removeImage = () => {
  fileToUpload.value = null
  localImagePreview.value = ''
  headerImageUrl.value = ''
}

// ── Guardar ───────────────────────────────────────────────────────────────────
const savePost = async () => {
  saving.value = true

  try {
    let finalImageUrl = headerImageUrl.value

    // Si hay imagen local, subirla vía API route
    if (fileToUpload.value) {
      const formData = new FormData()
      formData.append('file', fileToUpload.value)
      if (postId.value) formData.append('postId', postId.value)
      const { url } = await useAuthFetch<{ url: string }>('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })
      finalImageUrl = url
    }

    const postData: Record<string, unknown> = {
      title: title.value,
      content: content.value,
      headerImageUrl: finalImageUrl,
      headerImageAlt: headerImageAlt.value || null,
      published: published.value,
      category: category.value,
      isFeatured: isFeatured.value,
    }

    // Solo incluir publishDate si el usuario seleccionó una fecha explícitamente.
    // Si está vacío, se omite para que el servidor no sobrescriba el valor existente.
    if (publishDateInput.value) {
      postData.publishDate = new Date(publishDateInput.value).toISOString()
    }

    if (isEditing.value && postId.value) {
      await useAuthFetch(`/api/posts/${postId.value}`, { method: 'PATCH', body: postData })
    } else {
      await useAuthFetch('/api/posts', {
        method: 'POST',
        body: {
          ...postData,
          authorId: authStore.user?.uid || 'unknown',
          authorName: authStore.userName || authStore.user?.email || 'Redactor',
        },
      })
    }

    router.push('/admin')
  } catch (error) {
    console.error('Error saving post:', error)
    alert('Error al guardar la noticia.')
  } finally {
    saving.value = false
  }
}
</script>
