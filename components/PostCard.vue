<!-- components/PostCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
    <NuxtLink
      :to="`/post/${post.slug || post.id}`"
      class="block overflow-hidden relative"
      style="aspect-ratio: 16/9;"
    >
      <img
        v-if="post.headerImageUrl"
        :src="post.headerImageUrl"
        :alt="post.title"
        width="600"
        height="338"
        :loading="isLcp ? 'eager' : 'lazy'"
        :fetchpriority="isLcp ? 'high' : 'auto'"
        decoding="async"
        class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
      />
      <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
        <span class="text-gray-400 font-sans tracking-wide uppercase text-sm">Sin imagen</span>
      </div>
    </NuxtLink>

    <div class="p-6">
      <h2 class="text-2xl font-bold font-sans text-text-heading mb-2 leading-tight">
        <NuxtLink
          :to="`/post/${post.slug || post.id}`"
          class="hover:text-primary transition-colors"
        >
          {{ post.title }}
        </NuxtLink>
      </h2>
      <div class="text-gray-500 text-xs uppercase tracking-wider mb-4 font-sans font-medium">
        {{ formattedDate }}
        <span v-if="post.authorName" class="ml-2">&bull; {{ post.authorName }}</span>
      </div>
      <!-- Preview de contenido — strip HTML server-safe -->
      <div class="text-text-body font-serif text-base line-clamp-3 leading-relaxed">
        {{ textPreview }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

const props = defineProps<{ post: Post; isLcp?: boolean }>()

const formattedDate = computed(() => {
  if (!props.post.createdAt) return ''
  // createdAt ya viene como ISO string desde el servidor (serializado)
  const date = new Date(props.post.createdAt)
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
})

// Strip HTML server-safe (sin document.createElement, funciona en SSR)
const textPreview = computed(() => {
  if (!props.post.content) return ''
  return props.post.content
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .substring(0, 200)
})
</script>
