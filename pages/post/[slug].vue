<!-- pages/post/[slug].vue — Equivalente a src/views/PostDetailView.vue (SSR real) -->
<template>
  <article
    v-if="post"
    class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white shadow-sm mt-10 rounded-md border border-gray-100"
  >
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
        <!-- WhatsApp -->
        <button
          id="share-whatsapp-btn"
          class="flex items-center space-x-2 px-4 py-2 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-colors font-medium text-sm shadow-sm select-none"
          @click="shareOnWhatsApp"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
          </svg>
        </button>
        <!-- Facebook -->
        <button
          id="share-facebook-btn"
          class="flex items-center space-x-2 px-4 py-2 bg-[#1877F2] text-white rounded-full hover:bg-[#166FE5] transition-colors font-medium text-sm shadow-sm select-none"
          @click="shareOnFacebook"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.04c-5.5 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.5-10.02-10-10.02z"/>
          </svg>
        </button>
        <!-- X/Twitter -->
        <button
          id="share-twitter-btn"
          class="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm select-none"
          @click="shareOnTwitter"
        >
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
          </svg>
        </button>
        <!-- Copiar link -->
        <button
          id="share-copy-btn"
          class="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors font-medium text-sm shadow-sm select-none"
          @click="copyLink"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
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

    <div
      class="prose prose-lg md:prose-xl max-w-none text-text-body font-serif leading-relaxed"
      v-html="post.content"
    ></div>

    <KudosButton :post-id="post.id" :initial-count="post.kudosCount ?? 0" />
  </article>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

definePageMeta({ layout: 'default' })

const route = useRoute()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const slug = route.params.slug as string

// ── SSR Data Fetching ─────────────────────────────────────────────────────────
// Todo ocurre en el servidor. El HTML que llega al crawler ya contiene el artículo.
const { data: post, execute } = await useAsyncData<Post | null>(
  `post-${slug}`,
  () => {
    if (import.meta.client) {
      return useAuthFetch<Post>(`/api/posts/${slug}`).catch(() => null)
    }
    return $fetch<Post>(`/api/posts/${slug}`).catch(() => null)
  }
)

// El error 404 automático ahora se maneja dentro de onMounted -> refetchPost

// ── Helpers ───────────────────────────────────────────────────────────────────
const SITE_URL = config.public.siteUrl
const SITE_NAME = config.public.siteName

const extractText = (html: string) =>
  html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()

const description = computed(() =>
  post.value ? extractText(post.value.content).substring(0, 160) : ''
)

const postUrl = computed(() =>
  `${SITE_URL}/post/${post.value?.slug || post.value?.id}`
)

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

// ── SEO — useSeoMeta (server-rendered) ───────────────────────────────────────
useSeoMeta({
  title: () => post.value?.title || 'Noticia',
  description: () => description.value,
  ogType: 'article',
  ogTitle: () => post.value?.title,
  ogDescription: () => description.value,
  ogImage: () => post.value?.headerImageUrl,
  ogUrl: () => postUrl.value,
  ogSiteName: SITE_NAME,
  twitterCard: 'summary_large_image',
  twitterTitle: () => post.value?.title,
  twitterDescription: () => description.value,
  twitterImage: () => post.value?.headerImageUrl,
})

// Canonical + preload LCP image + JSON-LD
useHead({
  link: [
    { rel: 'canonical', href: () => postUrl.value },
    {
      rel: 'preload',
      as: 'image',
      href: () => post.value?.headerImageUrl ?? '',
      fetchpriority: 'high',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        if (!post.value) return ''
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: post.value.title,
          description: description.value,
          url: postUrl.value,
          datePublished: post.value.createdAt,
          dateModified: post.value.updatedAt || post.value.createdAt,
          image: post.value.headerImageUrl
            ? { '@type': 'ImageObject', url: post.value.headerImageUrl, width: 800, height: 450 }
            : undefined,
          author: {
            '@type': 'Person',
            name: post.value.authorName || SITE_NAME,
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.webp` },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl.value },
        })
      },
    },
  ],
})

// ── Share buttons (solo cliente) ──────────────────────────────────────────────
const copied = ref(false)
const currentUrl = ref('')

const refetchPost = async () => {
  await execute()
  if (!post.value) {
    throw createError({ statusCode: 404, statusMessage: 'Artículo no encontrado', fatal: true })
  }
}

onMounted(async () => {
  currentUrl.value = window.location.href
  
  // Si en SSR no se cargó el post (ej. era borrador y requería token)
  if (!post.value) {
    if (authStore.loading) {
      // Esperamos a que la autenticación se inicialice
      const unwatch = watch(() => authStore.loading, async (isLoading) => {
        if (!isLoading) {
          unwatch()
          await refetchPost()
        }
      })
    } else {
      await refetchPost()
    }
  }
})

const shareText = () => post.value ? `Mira esta noticia: ${post.value.title}` : 'Mira esta noticia'

const shareOnWhatsApp = () =>
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText() + ' ' + currentUrl.value)}`, '_blank')

const shareOnFacebook = () =>
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl.value)}`, '_blank')

const shareOnTwitter = () =>
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(shareText())}`, '_blank')

const copyLink = async () => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(currentUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
:deep(.prose p)  { margin-bottom: 1.5em; line-height: 1.85; }
:deep(.prose img) { width: 100%; border-radius: 0.5rem; margin-top: 2rem; margin-bottom: 2rem; }
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
