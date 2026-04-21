<!-- pages/category/[category].vue -->
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="flex items-center mb-12">
      <NuxtLink to="/" class="text-primary hover:underline font-medium mr-4">← Inicio</NuxtLink>
      <h1 class="text-4xl font-extrabold text-text-heading font-sans tracking-tight capitalize">
        {{ category }}
      </h1>
    </div>

    <div v-if="!posts || posts.length === 0" class="text-center py-20 text-gray-500 font-medium bg-white rounded-lg border border-gray-100 shadow-sm">
      No hay noticias publicadas en la categoría "{{ category }}" todavía.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

const route = useRoute()
const category = computed(() => route.params.category as string)

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: () => `${category.value} | La Chispa Sur`,
  description: () => `Noticias y artículos de la categoría ${category.value} en La Chispa Sur.`,
})

const { data: posts } = await useAsyncData<Post[]>(
  () => `posts-category-${category.value}`,
  () => $fetch<Post[]>(`/api/posts/category/${category.value}`),
  {
    default: () => [] as Post[],
  }
)
</script>
