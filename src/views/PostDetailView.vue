<template>
  <article v-if="post" class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white shadow-sm mt-10 rounded-md border border-gray-100">
    <header class="mb-10 text-center">
      <h1 class="text-4xl lg:text-5xl font-extrabold font-sans text-text-heading leading-tight mb-4">
        {{ post.title }}
      </h1>
      <div class="text-sm font-sans tracking-wide text-gray-500 uppercase flex items-center justify-center space-x-2 font-medium">
        <span>{{ formatDate(post.createdAt) }}</span>
        <span v-if="post.authorName">&bull; {{ post.authorName }}</span>
      </div>
    </header>

    <figure v-if="post.headerImageUrl" class="mb-10">
      <img :src="post.headerImageUrl" alt="Cabecera Noticia" class="w-full h-auto max-h-[500px] rounded-md shadow-sm object-cover" />
    </figure>

    <div class="prose prose-lg md:prose-xl max-w-none text-text-body font-serif leading-relaxed" v-html="post.content"></div>
  </article>

  <div v-else-if="loading" class="flex justify-center py-40">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>

  <div v-else class="text-center py-40 text-gray-500 font-sans">
    <h2 class="text-2xl font-bold mb-4 font-sans text-text-heading">Noticia no encontrada</h2>
    <router-link to="/" class="text-primary hover:underline font-medium">Volver a inicio</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPost, type Post } from '../services/postService';
import { useHead } from '@vueuse/head';

const route = useRoute();
const post = ref<Post | null>(null);
const loading = ref(true);

const extractText = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

useHead({
  title: () => post.value?.title || 'Noticia',
  meta: [
    { name: 'description', content: () => post.value ? extractText(post.value.content).substring(0, 160) : '' },
    { property: 'og:title', content: () => post.value?.title },
    { property: 'og:description', content: () => post.value ? extractText(post.value.content).substring(0, 160) : '' },
    { property: 'og:image', content: () => post.value?.headerImageUrl },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:image', content: () => post.value?.headerImageUrl }
  ]
});

onMounted(async () => {
  const id = route.params.id as string;
  try {
    post.value = await getPost(id);
  } catch (error) {
    console.error("Error loading post:", error);
  } finally {
    loading.value = false;
  }
});

const formatDate = (dateVal: any) => {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};
</script>

<style scoped>
/* Scoped styles to ensure rich text images fit nicely */
:deep(.prose img) {
  width: 100%;
  border-radius: 0.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
:deep(.prose h2) {
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-weight: 700;
  margin-top: 2.5rem;
}
:deep(.prose h3) {
  font-family: var(--font-sans);
  font-weight: 600;
}
</style>
