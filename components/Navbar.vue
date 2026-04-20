<!-- components/Navbar.vue -->
<template>
  <nav class="bg-primary text-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex-shrink-0">
          <NuxtLink to="/" class="flex items-center gap-3 text-2xl font-sans font-bold tracking-tight">
            <img
              src="/logo_80.webp"
              alt="La Chispa Sur Logo"
              width="80"
              height="80"
              class="h-14 w-auto"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
            />
            <span class="hidden sm:inline">La Chispa Sur</span>
          </NuxtLink>
        </div>

        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/"
            class="px-3 py-2 rounded-md hover:bg-secondary transition-colors font-medium"
          >
            Inicio
          </NuxtLink>

          <template v-if="authStore.isAdmin">
            <NuxtLink
              to="/admin"
              class="px-3 py-2 rounded-md bg-accent hover:opacity-90 transition-colors font-medium"
            >
              Panel Admin
            </NuxtLink>
            <button
              id="navbar-signout-btn"
              class="px-3 py-2 rounded-md hover:bg-secondary transition-colors font-medium text-gray-300"
              @click="handleSignOut"
            >
              Salir
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/')
}
</script>
