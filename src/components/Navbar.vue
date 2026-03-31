<template>
  <nav class="bg-primary text-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex-shrink-0">
          <router-link to="/" class="text-2xl font-serif font-bold tracking-tight">
            La Chispa Sur
          </router-link>
        </div>
        <div class="flex items-center space-x-4">
          <router-link to="/" class="px-3 py-2 rounded-md hover:bg-secondary transition-colors font-medium">
            Inicio
          </router-link>
          <template v-if="authStore.isAdmin">
            <router-link to="/admin" class="px-3 py-2 rounded-md bg-accent hover:opacity-90 transition-colors font-medium">
              Panel Admin
            </router-link>
            <button @click="handleSignOut" class="px-3 py-2 rounded-md hover:bg-secondary transition-colors font-medium text-gray-300">
              Salir
            </button>
          </template>
          <template v-else-if="!authStore.loading && !authStore.user">
            <router-link to="/login" class="px-3 py-2 rounded-md hover:bg-secondary transition-colors text-gray-300 text-sm">
              Editor Login
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleSignOut = async () => {
  await authStore.signOut();
  router.push('/');
};
</script>
