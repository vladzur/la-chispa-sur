<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
    <router-link :to="`/post/${post.id}`" class="block h-48 sm:h-64 overflow-hidden relative">
      <img v-if="post.headerImageUrl" :src="post.headerImageUrl" alt="Header image" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
      <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
        <span class="text-gray-400 font-sans tracking-wide uppercase text-sm">Sin imagen</span>
      </div>
    </router-link>
    <div class="p-6">
      <h2 class="text-2xl font-bold font-sans text-text-heading mb-2 leading-tight">
        <router-link :to="`/post/${post.id}`" class="hover:text-primary transition-colors">
          {{ post.title }}
        </router-link>
      </h2>
      <div class="text-gray-500 text-xs uppercase tracking-wider mb-4 font-sans font-medium">
        {{ formattedDate }}
        <span v-if="post.authorName" class="ml-2">&bull; {{ post.authorName }}</span>
      </div>
      <!-- Snippet that strips mostly visual tags and uses line-clamp -->
      <div class="text-text-body font-serif text-base line-clamp-3 leading-relaxed" v-html="stripHtml(post.content)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Post } from '../services/postService';

const props = defineProps<{ post: Post }>();

const formattedDate = computed(() => {
  if (!props.post.createdAt) return '';
  const date = props.post.createdAt.toDate ? props.post.createdAt.toDate() : new Date(props.post.createdAt);
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
});

const stripHtml = (html: string) => {
  // A minimal heuristic to display raw text for preview instead of big headers
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
</script>
