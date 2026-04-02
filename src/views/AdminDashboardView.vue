<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
      <h1 class="text-3xl font-bold font-sans text-text-heading">Noticias Publicadas</h1>
      <router-link to="/admin/editor" class="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm inline-flex items-center">
        + Redactar
      </router-link>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    <div v-else-if="posts.length === 0" class="text-center py-20 bg-gray-50 rounded-lg">
      <p class="text-gray-500 mb-4">No has publicado ninguna noticia aún.</p>
      <router-link to="/admin/editor" class="text-primary hover:underline">Comienza a redactar aquí</router-link>
    </div>
    <div v-else class="bg-white shadow-sm rounded-md overflow-hidden border border-gray-200">
      <ul class="divide-y divide-gray-200">
        <li v-for="post in posts" :key="post.id" class="px-6 py-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
          <div class="flex flex-col">
            <div class="flex items-center">
              <span class="text-lg font-semibold text-text-heading">{{ post.title }}</span>
              <span v-if="post.published === false" class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Borrador
              </span>
            </div>
            <span class="text-sm text-gray-500 mt-1 uppercase tracking-wide">{{ formatDate(post.createdAt) }}</span>
          </div>
          <div class="flex space-x-3">
            <router-link :to="`/post/${post.id}`" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver</router-link>
            <router-link :to="`/admin/editor/${post.id}`" class="text-amber-600 hover:text-amber-800 text-sm font-medium">Editar</router-link>
            <button @click="handleDelete(post.id)" class="text-red-600 hover:text-red-800 text-sm font-medium">Borrar</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPosts, deletePost, type Post } from '../services/postService';

const posts = ref<Post[]>([]);
const loading = ref(true);

const loadPosts = async () => {
  loading.value = true;
  posts.value = await getPosts(true);
  loading.value = false;
};

onMounted(loadPosts);

const formatDate = (dateVal: any) => {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
};

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres borrar esta noticia?')) {
    await deletePost(id);
    await loadPosts();
  }
};
</script>
