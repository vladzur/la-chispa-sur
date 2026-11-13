<!-- components/admin/RichTextEditor.vue — Editor de texto enriquecido (Tiptap) reutilizable -->
<!-- Se auto-registra como <AdminRichTextEditor /> por la subcarpeta admin/ -->
<template>
  <div class="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm flex flex-col min-h-[400px]">
    <div v-if="editor" class="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2">
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">Bold</button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }" class="px-3 py-1 rounded text-sm italic hover:bg-gray-200 border border-gray-300">Italic</button>
      <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'bg-gray-200': editor.isActive('underline') }" class="px-3 py-1 rounded text-sm underline hover:bg-gray-200 border border-gray-300">Underline</button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-gray-200': editor.isActive('strike') }" class="px-3 py-1 rounded text-sm line-through hover:bg-gray-200 border border-gray-300">Strike</button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">H2</button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 3 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">H3</button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 4 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 4 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300">H4</button>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'bg-gray-200': editor.isActive('bulletList') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">• Lista</button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'bg-gray-200': editor.isActive('orderedList') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">1. Lista</button>
      <button type="button" @click="setLink" :class="{ 'bg-gray-200': editor.isActive('link') }" class="px-3 py-1 rounded text-sm hover:bg-gray-200 border border-gray-300">Enlace</button>
    </div>

    <EditorContent
      :editor="editor"
      class="flex-grow p-4 focus:outline-none prose prose-lg max-w-none text-text-body font-serif"
    />
  </div>
</template>

<script setup lang="ts">
// Tiptap — client-only (requiere DOM)
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Empieza a escribir aquí...',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Contenido inicial: el modelValue o el placeholder como primer párrafo
const initialContent = () => props.modelValue || `<p>${props.placeholder}</p>`

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // SEO: h2/h3/h4 permitidos — h1 reservado para el título de la página
      heading: { levels: [2, 3, 4] },
      bulletList: { HTMLAttributes: { class: 'list-disc ml-6 space-y-1' } },
      orderedList: { HTMLAttributes: { class: 'list-decimal ml-6 space-y-1' } },
      listItem: { HTMLAttributes: { class: 'pl-1' } },
    }),
    Image,
    Underline,
    Link.configure({ openOnClick: false }),
  ],
  content: initialContent(),
  editorProps: { attributes: { class: 'focus:outline-none min-h-[300px]' } },
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() ?? '')
  },
})

// Sincroniza cambios externos del modelValue (ej: al cargar un registro existente
// en modo edición). El guard evita pisar el contenido mientras el usuario escribe.
watch(() => props.modelValue, (value) => {
  if (!editor.value) return
  if (value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value || initialContent())
  }
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

onBeforeUnmount(() => {
  editor.value?.destroy()
})
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

/* ── Heading styles dentro del editor (igualan la visualización pública) ──── */
.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  color: #1A202C;
  font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.025em;
}
.ProseMirror h3 {
  font-size: 1.25em;
  font-weight: 700;
  line-height: 1.4;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  color: #1A202C;
  font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.025em;
}
.ProseMirror h4 {
  font-size: 1.1em;
  font-weight: 700;
  line-height: 1.5;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
  color: #1A202C;
  font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.025em;
}
</style>
