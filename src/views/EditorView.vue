<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold font-sans text-text-heading">
        {{ isEditing ? 'Editar Noticia' : 'Redactar Noticia' }}
      </h1>
      <router-link to="/admin" class="text-gray-500 hover:text-gray-800">Volver</router-link>
    </div>

    <form @submit.prevent="savePost" class="space-y-6">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input v-model="title" type="text" required class="w-full text-2xl font-bold font-sans px-4 py-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary shadow-sm" placeholder="El titular principal de la noticia..." />
      </div>

      <!-- Header Image -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Imagen de Cabecera</label>
        <input type="file" @change="handleImageChange" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90 transition-colors" />
        
        <div v-if="localImagePreview || headerImageUrl" class="mt-4 h-48 w-full relative rounded overflow-hidden">
          <img :src="localImagePreview || headerImageUrl" class="object-cover w-full h-full" alt="Preview"/>
          <button v-if="localImagePreview || headerImageUrl" type="button" @click="removeImage" class="absolute top-2 right-2 bg-red-600 text-white rounded-md px-2 py-1 text-xs opacity-80 hover:opacity-100">Quitar</button>
        </div>
      </div>

      <!-- Tiptap Editor (WYSIWYG) -->
      <div class="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm flex flex-col min-h-[400px]">
        <div v-if="editor" class="bg-gray-50 border-b border-gray-200 p-2 flex space-x-2">
          <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300 font-sans">Bold</button>
          <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }" class="px-3 py-1 rounded text-sm italic hover:bg-gray-200 border border-gray-300 font-serif">Italic</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300 font-sans">H2</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 3 }) }" class="px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 border border-gray-300 font-sans">H3</button>
        </div>
        
        <editor-content :editor="editor" class="flex-grow p-4 focus:outline-none prose prose-lg max-w-none text-text-body font-serif" />
      </div>

      <!-- Footer Buttons -->
      <div class="flex justify-end pt-4 border-t border-gray-200">
        <button type="submit" :disabled="saving" class="bg-primary text-white font-medium py-2 px-6 rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-colors shadow-sm">
          {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar Noticia' : 'Publicar Noticia') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { getPost, createPost, updatePost } from '../services/postService';
import { uploadHeaderImage } from '../services/imageService';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isEditing = ref(false);
const postId = ref<string | null>(null);

const title = ref('');
const headerImageUrl = ref('');
const localImagePreview = ref('');
const fileToUpload = ref<File | null>(null);
const saving = ref(false);

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Image,
  ],
  content: '<p>Empieza a escribir la noticia aquí...</p>',
  editorProps: {
    attributes: {
      class: 'focus:outline-none min-h-[300px]',
    },
  },
});

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true;
    postId.value = route.params.id as string;
    
    saving.value = true;
    const post = await getPost(postId.value);
    saving.value = false;
    
    if (post) {
      title.value = post.title;
      headerImageUrl.value = post.headerImageUrl;
      if (editor.value) editor.value.commands.setContent(post.content);
    }
  }
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value);
  }
});

const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    fileToUpload.value = target.files[0];
    if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value);
    localImagePreview.value = URL.createObjectURL(fileToUpload.value);
  }
};

const removeImage = () => {
  fileToUpload.value = null;
  localImagePreview.value = '';
  headerImageUrl.value = '';
};

const savePost = async () => {
  if (!editor.value) return;
  saving.value = true;

  try {
    let finalImageUrl = headerImageUrl.value;
    
    if (fileToUpload.value) {
      // Real upload will be required once dummy gets real credentials.
      // Expect an error here on dummy credentials.
      try {
        finalImageUrl = await uploadHeaderImage(fileToUpload.value, isEditing.value ? postId.value! : undefined);
      } catch (err) {
        console.warn("Real upload requires valid Firebase credentials. Using fake URL.");
        finalImageUrl = localImagePreview.value; // For demo purpose because Firebase is dummy
      }
    }

    const postData = {
      title: title.value,
      content: editor.value.getHTML(),
      headerImageUrl: finalImageUrl,
    };

    if (isEditing.value && postId.value) {
      await updatePost(postId.value, postData);
    } else {
      await createPost({
        ...postData,
        authorId: authStore.user?.uid || 'unknown',
        authorName: authStore.user?.email || 'Redactor',
      });
    }

    router.push('/admin');
  } catch (error) {
    console.error("Error saving post:", error);
    alert("Error al guardar la noticia.");
  } finally {
    saving.value = false;
  }
};
</script>

<style>
/* Prose overrides mapping to fonts are handled by global tiptap prose classes generated in Tailwind */
</style>
