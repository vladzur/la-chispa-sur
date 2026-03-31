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
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPosts, type Post } from '../services/postService';
import PostCard from '../components/PostCard.vue';

const posts = ref<Post[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    posts.value = await getPosts();
  } catch (err) {
    console.error("Error loading posts:", err);
  } finally {
    loading.value = false;
  }
});
</script>
