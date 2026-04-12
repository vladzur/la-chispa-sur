<template>
  <article v-if="post" class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white shadow-sm mt-10 rounded-md border border-gray-100">
    <header class="mb-10 text-center">
      <h1 class="text-4xl lg:text-5xl font-extrabold font-sans text-text-heading leading-tight mb-4">
        {{ post.title }}
      </h1>
      <div class="text-sm font-sans tracking-wide text-gray-500 uppercase flex items-center justify-center space-x-2 font-medium mb-6">
        <span>{{ formatDate(post.createdAt) }}</span>
        <span v-if="post.authorName">&bull; {{ post.authorName }}</span>
      </div>

      <!-- Botones de compartir -->
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button @click="shareOnWhatsApp" class="flex items-center space-x-2 px-4 py-2 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-colors font-medium text-sm shadow-sm select-none">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/></svg>
          <!-- <span>WhatsApp</span> -->
        </button>
        <button @click="shareOnFacebook" class="flex items-center space-x-2 px-4 py-2 bg-[#1877F2] text-white rounded-full hover:bg-[#166FE5] transition-colors font-medium text-sm shadow-sm select-none">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.04c-5.5 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.5-10.02-10-10.02z"/></svg>
          <!-- <span>Facebook</span> -->
        </button>
        <button @click="shareOnTwitter" class="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm select-none">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
          <!-- <span>X</span> -->
        </button>
        <button @click="copyLink" class="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors font-medium text-sm shadow-sm select-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          <span v-if="!copied">Copiar link</span>
          <span v-else>¡Copiado!</span>
        </button>
      </div>
    </header>

    <figure v-if="post.headerImageUrl" class="mb-10">
      <img
        :src="post.headerImageUrl"
        :alt="post.title"
        width="800"
        height="450"
        fetchpriority="high"
        loading="eager"
        decoding="sync"
        class="w-full h-auto max-h-[500px] rounded-md shadow-sm object-cover"
      />
    </figure>

    <div class="prose prose-lg md:prose-xl max-w-none text-text-body font-serif leading-relaxed" v-html="post.content"></div>

    <!-- Sección de kudos -->
    <KudosButton :post-id="post.id" :initial-count="post.kudosCount ?? 0" />
  </article>

  <div v-else-if="loading" class="flex justify-center py-40">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>

  <div v-else class="text-center py-40 text-gray-500 font-sans">
    <h2 class="text-2xl font-bold mb-4 font-sans text-text-heading">Noticia no encontrada</h2>
    <router-link to="/" class="text-primary hover:underline font-medium">Volver a inicio</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import KudosButton from '../components/KudosButton.vue';
import { useRoute } from 'vue-router';
import { getPost, type Post } from '../services/postService';
import { useHead } from '@vueuse/head';
import { useAuthStore } from '../stores/auth';
import { watch } from 'vue';

const route = useRoute();
const authStore = useAuthStore();
const post = ref<Post | null>(null);
const loading = ref(true);
const currentUrl = ref('');
const copied = ref(false);

const extractText = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

const SITE_NAME = 'La Chispa Sur';
const SITE_URL = 'https://lachispasur.cl';
const SITE_LOGO = `${SITE_URL}/logo.webp`;

const toISOString = (dateVal: any): string => {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  return date.toISOString();
};

useHead({
  title: () => post.value?.title || 'Noticia',
  // Preload LCP hero image — browser fetches it during HTML parsing, before JS runs
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: () => post.value?.headerImageUrl ?? '',
      fetchpriority: 'high'
    }
  ],
  meta: [
    { name: 'description', content: () => post.value ? extractText(post.value.content).substring(0, 160) : '' },
    // Open Graph / Facebook / WhatsApp
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: () => post.value?.title },
    { property: 'og:description', content: () => post.value ? extractText(post.value.content).substring(0, 160) : '' },
    { property: 'og:image', content: () => post.value?.headerImageUrl },
    { property: 'og:url', content: () => currentUrl.value },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: () => post.value?.title },
    { name: 'twitter:description', content: () => post.value ? extractText(post.value.content).substring(0, 160) : '' },
    { name: 'twitter:image', content: () => post.value?.headerImageUrl },
    { name: 'twitter:url', content: () => currentUrl.value }
  ],
  // JSON-LD Structured Data — NewsArticle schema for Google rich results
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        if (!post.value) return '';
        const description = extractText(post.value.content).substring(0, 200);
        const schema: Record<string, any> = {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: post.value.title,
          description,
          url: currentUrl.value || `${SITE_URL}/post/${post.value.slug || post.value.id}`,
          datePublished: toISOString(post.value.createdAt),
          dateModified: toISOString(post.value.updatedAt || post.value.createdAt),
          author: {
            '@type': 'Person',
            name: post.value.authorName || SITE_NAME
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: {
              '@type': 'ImageObject',
              url: SITE_LOGO,
              width: 200,
              height: 60
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': currentUrl.value || `${SITE_URL}/post/${post.value.slug || post.value.id}`
          }
        };
        if (post.value.headerImageUrl) {
          schema.image = {
            '@type': 'ImageObject',
            url: post.value.headerImageUrl,
            width: 800,
            height: 450
          };
        }
        return JSON.stringify(schema);
      }
    }
  ]
});

const loadPost = async () => {
  const slugOrId = route.params.slug as string;
  try {
    const fetchedPost = await getPost(slugOrId);
    // Verificar visibilidad
    if (fetchedPost && fetchedPost.published === false && !authStore.isAdmin) {
      post.value = null;
    } else {
      post.value = fetchedPost;
    }
  } catch (error) {
    console.error("Error loading post:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  currentUrl.value = typeof window !== 'undefined' ? window.location.href : '';
  if (!authStore.loading) {
    await loadPost();
  }
});

// React to auth state changes to avoid race conditions on direct URL access
watch(() => authStore.loading, async (newVal) => {
  if (!newVal) {
    await loadPost();
  }
});

const shareText = () => post.value ? `Mira esta noticia: ${post.value.title}` : 'Mira esta noticia';

const shareOnWhatsApp = () => {
  if (typeof window !== 'undefined') {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText() + ' ' + currentUrl.value)}`;
    window.open(url, '_blank');
  }
};

const shareOnFacebook = () => {
  if (typeof window !== 'undefined') {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl.value)}`;
    window.open(url, '_blank');
  }
};

const shareOnTwitter = () => {
  if (typeof window !== 'undefined') {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(shareText())}`;
    window.open(url, '_blank');
  }
};

const copyLink = async () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(currentUrl.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
};

const formatDate = (dateVal: any) => {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};
</script>

<style scoped>
/* Scoped styles to ensure rich text images fit nicely */
:deep(.prose img) {
  width: 100%;
  border-radius: 0.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
:deep(.prose h2) {
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1.2;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
}
:deep(.prose h3) {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.3;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
</style>
