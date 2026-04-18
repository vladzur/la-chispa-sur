<!-- pages/index.vue — Equivalente a src/views/HomeView.vue -->
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-extrabold text-text-heading mb-10 text-center font-sans tracking-tight">
      Últimas Noticias
    </h1>

    <div v-if="!posts || posts.length === 0" class="text-center py-20 text-gray-500 font-medium">
      No hay noticias publicadas todavía.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <PostCard
        v-for="(post, index) in posts"
        :key="post.id"
        :post="post"
        :is-lcp="index === 0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

definePageMeta({ layout: 'default' })

// ── SEO ──────────────────────────────────────────────────────────────────────
// useSeoMeta se renderiza en el servidor → los crawlers ven los tags en el HTML inicial
useSeoMeta({
  title: 'Últimas Noticias',
  description: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.',
  ogType: 'website',
  ogUrl: 'https://lachispasur.cl/',
  ogTitle: 'La Chispa Sur | Inicio',
  ogDescription: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.',
  ogImage: 'https://lachispasur.cl/logo.webp',
  ogSiteName: 'La Chispa Sur',
  twitterCard: 'summary_large_image',
  twitterTitle: 'La Chispa Sur | Inicio',
  twitterDescription: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.',
  twitterImage: 'https://lachispasur.cl/logo.webp',
})

// ── Data Fetching SSR ─────────────────────────────────────────────────────────
// useAsyncData ejecuta $fetch EN EL SERVIDOR durante SSR.
// El HTML que llega al browser ya contiene el grid de noticias completo.
const { data: posts } = await useAsyncData<Post[]>(
  'posts-home',
  () => $fetch('/api/posts'),
  {
    default: () => [] as Post[],
  }
)
</script>
