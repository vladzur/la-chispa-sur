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

const authStore = useAuthStore();

onMounted(() => {
  authStore.init();
});
</script>
