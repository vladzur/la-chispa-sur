<template>
  <div class="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-bg-light">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-text-heading font-sans">
        Acceso Editores
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Inicia sesión para redactar o editar noticias
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"> Correo electrónico </label>
            <div class="mt-1">
              <input id="email" v-model="email" name="email" type="email" autocomplete="email" required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700"> Contraseña </label>
            <div class="mt-1">
              <input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div v-if="error" class="text-accent text-sm text-center">
            {{ error }}
          </div>

          <div>
            <button type="submit" :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50">
              <span v-if="loading">Cargando...</span>
              <span v-else>Iniciar sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // Router logic will handle redirection based on roles when requested,
    // but here we just send to admin board if login triggers auth event.
    router.push('/admin');
  } catch (err: any) {
    console.error(err);
    error.value = "Credenciales inválidas o error de red.";
  } finally {
    loading.value = false;
  }
};
</script>
