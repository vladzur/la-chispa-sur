<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-grow">
      <router-view />
    </main>
    <footer class="bg-secondary text-gray-400 py-6 text-center text-sm">
      <p>&copy; 2026 La Chispa Sur - Periodismo Independiente</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import Navbar from './components/Navbar.vue';
import { useHead } from '@vueuse/head';

const authStore = useAuthStore();

useHead({
  titleTemplate: (title) => title ? `${title} | La Chispa Sur` : 'La Chispa Sur',
  meta: [
    { name: 'description', content: 'Diario independiente con las últimas noticias de la región sur.' },
    { property: 'og:site_name', content: 'La Chispa Sur' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
});

onMounted(() => {
  authStore.init();
});
</script>
