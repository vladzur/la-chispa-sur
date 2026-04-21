<!-- components/FeaturedPost.vue -->
<template>
  <div class="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div class="flex flex-col lg:flex-row">
      <!-- Imagen -->
      <NuxtLink
        :to="`/post/${post.slug || post.id}`"
        class="lg:w-2/3 block overflow-hidden relative"
        style="aspect-ratio: 16/9;"
      >
        <img
          v-if="post.headerImageUrl"
          :src="post.headerImageUrl"
          :alt="post.title"
          class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
          <span class="text-gray-400 font-sans tracking-wide uppercase text-lg">Sin imagen</span>
        </div>
        
        <!-- Badge de Destacado -->
        <div class="absolute top-4 left-4">
          <span class="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
            Destacado
          </span>
        </div>
      </NuxtLink>

      <!-- Contenido -->
      <div class="lg:w-1/3 p-8 flex flex-col justify-center">
        <div class="mb-4">
          <span v-if="post.category" class="text-primary font-sans font-bold text-sm uppercase tracking-widest">
            {{ post.category }}
          </span>
        </div>
        
        <h2 class="text-3xl lg:text-4xl font-extrabold font-sans text-text-heading mb-4 leading-tight">
          <NuxtLink
            :to="`/post/${post.slug || post.id}`"
            class="hover:text-primary transition-colors duration-300"
          >
            {{ post.title }}
          </NuxtLink>
        </h2>
        
        <div class="text-gray-500 text-sm mb-6 font-sans">
          {{ formattedDate }}
          <span v-if="post.authorName" class="ml-2 font-medium text-gray-700">&bull; {{ post.authorName }}</span>
        </div>
        
        <div class="text-text-body font-serif text-lg line-clamp-4 leading-relaxed mb-8">
          {{ textPreview }}
        </div>
        
        <div>
          <NuxtLink
            :to="`/post/${post.slug || post.id}`"
            class="inline-flex items-center text-primary font-bold font-sans uppercase tracking-wider hover:translate-x-2 transition-transform duration-300"
          >
            Leer más
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

const props = defineProps<{ post: Post }>()

// Preload image
if (props.post.headerImageUrl) {
  useHead({
    link: [
      {
        rel: 'preload',
        as: 'image',
        href: props.post.headerImageUrl,
        fetchpriority: 'high'
      }
    ]
  })
}

const formattedDate = computed(() => {
  if (!props.post.createdAt) return ''
  const date = new Date(props.post.createdAt)
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
})

const textPreview = computed(() => {
  if (!props.post.content) return ''
  return props.post.content
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .substring(0, 300)
})
</script>
