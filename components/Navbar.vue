<!-- components/Navbar.vue -->
<template>
  <nav class="bg-primary text-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <NuxtLink to="/" class="flex items-center gap-3 text-xl font-sans font-bold tracking-tight">
            <img
              src="/logo_80.webp"
              alt="La Chispa Sur Logo"
              width="80"
              height="80"
              class="h-12 w-auto"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
            />
            <span class="hidden lg:inline">La Chispa Sur</span>
          </NuxtLink>
        </div>

        <!-- Categorías (Escritorio) -->
        <div class="hidden md:flex items-center space-x-1 lg:space-x-4">
          <NuxtLink
            v-for="cat in categories"
            :key="cat"
            :to="`/category/${cat}`"
            class="px-3 py-2 rounded-md hover:bg-white/10 transition-colors font-medium text-sm uppercase tracking-wider"
            active-class="bg-white/20"
          >
            {{ cat }}
          </NuxtLink>
        </div>

        <!-- Acciones / Admin -->
        <div class="flex items-center space-x-2">
          <template v-if="authStore.isAdmin">
            <NuxtLink
              to="/admin"
              class="px-3 py-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium text-sm"
            >
              Admin
            </NuxtLink>
            <button
              id="navbar-signout-btn"
              class="p-2 rounded-md hover:bg-white/10 transition-colors text-white/70"
              @click="handleSignOut"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
              </svg>
            </button>
          </template>
          
          <!-- Botón Menú Móvil -->
          <button 
            @click="isMenuOpen = !isMenuOpen"
            class="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Menú Móvil -->
    <div v-if="isMenuOpen" class="md:hidden bg-primary border-t border-white/10 px-4 pt-2 pb-6 space-y-1 shadow-xl">
      <NuxtLink
        v-for="cat in categories"
        :key="cat"
        :to="`/category/${cat}`"
        class="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors font-medium text-base uppercase tracking-widest"
        @click="isMenuOpen = false"
      >
        {{ cat }}
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const isMenuOpen = ref(false)

const categories = [
  'Actualidad',
  'Nacional',
  'Regional',
  'Política',
  'Cultura',
  'Opinión'
]

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/')
}
</script>
