<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Post Destacado -->
    <section v-if="featuredPost" class="mb-20">
      <FeaturedPost :post="featuredPost" />
    </section>

    <!-- Secciones por Categoría -->
    <div v-if="!allPosts || allPosts.length === 0" class="text-center py-20 text-gray-500 font-medium">
      No hay noticias publicadas todavía.
    </div>
    
    <div v-else class="space-y-20">
      <section v-for="(categoryPosts, categoryName) in groupedPosts" :key="categoryName" class="scroll-mt-20">
        <div class="flex items-center mb-8">
          <h2 class="text-3xl font-extrabold text-text-heading font-sans tracking-tight pr-4">
            {{ categoryName }}
          </h2>
          <div class="flex-grow border-t-2 border-primary/20"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PostCard
            v-for="post in categoryPosts"
            :key="post.id"
            :post="post"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'La Chispa Sur | Periodismo Crítico desde La Araucanía',
  description: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.',
  ogType: 'website',
  ogUrl: 'https://lachispasur.cl/',
  ogTitle: 'La Chispa Sur | Inicio',
  ogDescription: 'Periodismo digital independiente y crítico desde La Araucanía. Abordamos la realidad nacional con perspectiva de izquierda, análisis y voz territorial.',
  ogImage: 'https://lachispasur.cl/logo.webp',
  ogSiteName: 'La Chispa Sur',
  twitterCard: 'summary_large_image',
})

const { data: allPosts } = await useAsyncData<Post[]>(
  'posts-home',
  () => $fetch<Post[]>('/api/posts'),
  {
    default: () => [] as Post[],
  }
)

// 1. Encontrar el post destacado (el más reciente marcado como isFeatured)
const featuredPost = computed(() => {
  return allPosts.value.find(p => p.isFeatured) || allPosts.value[0]
})

// 2. Resto de los posts (excluyendo el destacado actual)
const remainingPosts = computed(() => {
  if (!featuredPost.value) return []
  return allPosts.value.filter(p => p.id !== featuredPost.value?.id)
})

// 3. Agrupar posts por categoría
const groupedPosts = computed(() => {
  const groups: Record<string, Post[]> = {}
  
  remainingPosts.value.forEach(post => {
    const cat = post.category || 'Actualidad'
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(post)
  })
  
  return groups
})
</script>
