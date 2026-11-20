<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="sr-only">La Chispa Sur — Periodismo Crítico desde La Araucanía</h1>
    <!-- Post Destacado -->
    <section v-if="featuredPost" class="mb-20">
      <FeaturedPost :post="featuredPost" />
    </section>

    <!-- Posts Recientes -->
    <section v-if="recentPosts.length > 0" class="mb-20">
      <div class="flex items-center mb-8">
        <h2 class="text-3xl font-extrabold text-text-heading font-sans tracking-tight pr-4">
          Lo más reciente
        </h2>
        <div class="flex-grow border-t-2 border-primary/20"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PostCard
          v-for="post in recentPosts"
          :key="post.id"
          :post="post"
        />
      </div>
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
import type { Post, PostPage } from '~/types/post'

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

const HOME_PAGE_SIZE = 20
const SECTION_SIZE = 3

// Página principal: la destacada y las 9 recientes salen de aquí (paginado)
const postsQuery = await useAsyncData<PostPage>(
  'posts-home',
  () => $fetch<PostPage>(`/api/posts?limit=${HOME_PAGE_SIZE}`),
  {
    default: () => ({ items: [], nextCursor: null }) as PostPage,
  }
)

const allPosts = computed(() => postsQuery.data.value.items)

// Secciones por categoría: 3 notas de cada categoría oficial, una petición por
// categoría con límite acotado (antes la portada descargaba el corpus completo).
const sectionsQuery = await useAsyncData<Record<string, Post[]>>(
  'posts-home-sections',
  async () => {
    const pairs = await Promise.all(
      NEWS_CATEGORIES.map(async (category) => {
        const page = await $fetch<PostPage>(
          `/api/posts?category=${encodeURIComponent(category)}&limit=${SECTION_SIZE + 1}`
        )
        return [category, page.items] as const
      })
    )
    return Object.fromEntries(pairs)
  },
  {
    default: () => ({} as Record<string, Post[]>),
  }
)

// 1. Encontrar el post destacado (el más reciente marcado como isFeatured)
const featuredPost = computed(() => {
  return allPosts.value.find(p => p.isFeatured) || allPosts.value[0]
})

// 2. Resto de los posts de la primera página (excluyendo el destacado actual)
const remainingPosts = computed(() => {
  if (!featuredPost.value) return []
  return allPosts.value.filter(p => p.id !== featuredPost.value?.id)
})

// 3. Posts más recientes (9 primeros, excluyendo el destacado)
const recentPosts = computed(() => {
  return remainingPosts.value.slice(0, 9)
})

// 4. IDs ya visibles arriba, para no repetirlos en las secciones de categoría
const topIds = computed(() => {
  const ids = recentPosts.value.map(p => p.id)
  if (featuredPost.value) ids.push(featuredPost.value.id)
  return new Set(ids)
})

// 5. Agrupar posts por categoría, respetando el orden oficial de las secciones
//    (fuente única: utils/categories.ts)
const groupedPosts = computed(() => {
  const groups: Record<string, Post[]> = {}
  const sections = sectionsQuery.data.value

  for (const category of sortCategories(Object.keys(sections))) {
    const posts = (sections[category] || [])
      .filter(post => !topIds.value.has(post.id))
      .slice(0, SECTION_SIZE)

    if (posts.length > 0) groups[category] = posts
  }

  return groups
})
</script>
