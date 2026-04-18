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
        <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          id="editor-title"
          v-model="title"
          type="text"
          required
          class="w-full text-2xl font-bold font-sans px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none"
          placeholder="El titular principal de la noticia..."
        />
      </div>

      <!-- Imagen de cabecera -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Imagen de Cabecera</label>
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
      </div>

      <!-- Editor Tiptap WYSIWYG -->
      <div class="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm flex flex-col min-h-[400px]">
        <div v-if="editor" class="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2">
          <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">Bold</button>
          <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }" class="px-3 py-1 rounded text-sm italic hover:bg-gray-200 border border-gray-300">Italic</button>
          <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'bg-gray-200': editor.isActive('underline') }" class="px-3 py-1 rounded text-sm underline hover:bg-gray-200 border border-gray-300">Underline</button>
          <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-gray-200': editor.isActive('strike') }" class="px-3 py-1 rounded text-sm line-through hover:bg-gray-200 border border-gray-300">Strike</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">H2</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 3 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">H3</button>
          <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'bg-gray-200': editor.isActive('bulletList') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">• Lista</button>
          <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'bg-gray-200': editor.isActive('orderedList') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">1. Lista</button>
          <button type="button" @click="setLink" :class="{ 'bg-gray-200': editor.isActive('link') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">Enlace</button>
        </div>

        <EditorContent
          :editor="editor"
          class="flex-grow p-4 focus:outline-none prose prose-lg max-w-none text-text-body font-serif"
        />
      </div>

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
// Tiptap — client-only (requiere DOM)
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
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
const headerImageUrl = ref('')
const localImagePreview = ref('')
const fileToUpload = ref<File | null>(null)
const saving = ref(false)
const published = ref(true)

// ── Tiptap editor (solo cliente) ─────────────────────────────────────────────
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      bulletList: { HTMLAttributes: { class: 'list-disc ml-6 space-y-1' } },
      orderedList: { HTMLAttributes: { class: 'list-decimal ml-6 space-y-1' } },
      listItem: { HTMLAttributes: { class: 'pl-1' } },
    }),
    Image,
    Underline,
    Link.configure({ openOnClick: false }),
  ],
  content: '<p>Empieza a escribir la noticia aquí...</p>',
  editorProps: { attributes: { class: 'focus:outline-none min-h-[300px]' } },
})

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href as string
  const url = window.prompt('URL del enlace', previousUrl || '')
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// ── Cargar post existente ─────────────────────────────────────────────────────
onMounted(async () => {
  if (postId.value) {
    saving.value = true
    try {
      const post = await $fetch<Post>(`/api/posts/${postId.value}`)
      title.value = post.title
      headerImageUrl.value = post.headerImageUrl
      published.value = post.published !== false
      if (editor.value) editor.value.commands.setContent(post.content)
    } finally {
      saving.value = false
    }
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
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
  if (!editor.value) return
  saving.value = true

  try {
    let finalImageUrl = headerImageUrl.value

    // Si hay imagen local, subirla vía API route
    if (fileToUpload.value) {
      const formData = new FormData()
      formData.append('file', fileToUpload.value)
      if (postId.value) formData.append('postId', postId.value)
      const { url } = await $fetch<{ url: string }>('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })
      finalImageUrl = url
    }

    const postData = {
      title: title.value,
      content: editor.value.getHTML(),
      headerImageUrl: finalImageUrl,
      published: published.value,
    }

    if (isEditing.value && postId.value) {
      await $fetch(`/api/posts/${postId.value}`, { method: 'PATCH', body: postData })
    } else {
      await $fetch('/api/posts', {
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

<style>
/* Estilos del editor Tiptap */
.ProseMirror { outline: none; min-height: 300px; }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
