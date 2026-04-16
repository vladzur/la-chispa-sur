<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-extrabold text-text-heading mb-10 text-center font-sans tracking-tight">
      Últimas Noticias
    </h1>
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    <div v-else-if="posts.length === 0" class="text-center py-20 text-gray-500 font-medium">
      No hay noticias publicadas todavía.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <PostCard v-for="(post, index) in posts" :key="post.id" :post="post" :is-lcp="index === 0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPosts, type Post } from '../services/postService';
import PostCard from '../components/PostCard.vue';
import { useHead } from '@vueuse/head';

useHead({
  title: 'Inicio',
  meta: [
    { name: 'description', content: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://lachispasur.cl/' },
    { property: 'og:title', content: 'La Chispa Sur | Inicio' },
    { property: 'og:description', content: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.' },
    { property: 'og:image', content: 'https://lachispasur.cl/logo.webp' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'La Chispa Sur | Inicio' },
    { name: 'twitter:description', content: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.' },
    { name: 'twitter:image', content: 'https://lachispasur.cl/logo.webp' },
  ]
});

const posts = ref<Post[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const fetchedPosts = await getPosts();
    posts.value = fetchedPosts.filter(p => p.published !== false);
  } catch (err) {
    console.error("Error loading posts:", err);
  } finally {
    loading.value = false;
  }
});
</script>
