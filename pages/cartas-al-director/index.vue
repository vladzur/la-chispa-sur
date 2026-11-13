<!-- pages/cartas-al-director/index.vue — Listado público de Cartas al Director -->
<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="flex items-center mb-6">
      <NuxtLink to="/" class="text-primary hover:underline font-medium mr-4">← Inicio</NuxtLink>
      <h1 class="text-4xl font-extrabold text-text-heading font-sans tracking-tight">
        Cartas al Director
      </h1>
    </div>

    <p class="text-lg text-text-body font-serif leading-relaxed mb-12">
      Espacio de participación ciudadana donde nuestras lectoras y lectores dialogan con la
      línea editorial de La Chispa Sur. Las opiniones aquí expresadas son de exclusiva
      responsabilidad de sus autores y no necesariamente reflejan la postura de este medio.
    </p>

    <div v-if="!letters || letters.length === 0" class="text-center py-20 text-gray-500 font-medium bg-white rounded-lg border border-gray-100 shadow-sm">
      No hay cartas publicadas todavía.
    </div>
    <div v-else class="space-y-6">
      <LetterCard
        v-for="letter in letters"
        :key="letter.id"
        :letter="letter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Letter } from '~/types/letter'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()
const SITE_NAME = config.public.siteName
const SITE_URL = config.public.siteUrl

const { data: letters } = await useAsyncData<Letter[]>(
  'letters-list',
  () => $fetch<Letter[]>('/api/letters'),
  {
    default: () => [] as Letter[],
  }
)

useSeoMeta({
  title: 'Cartas al Director',
  description: `Espacio de participación ciudadana de ${SITE_NAME}: cartas enviadas por nuestras lectoras y lectores.`,
  ogType: 'website',
  ogUrl: `${SITE_URL}/cartas-al-director`,
  ogTitle: `Cartas al Director | ${SITE_NAME}`,
  ogDescription: `Espacio de participación ciudadana de ${SITE_NAME}: cartas enviadas por nuestras lectoras y lectores.`,
  ogImage: `${SITE_URL}/logo.webp`,
  ogSiteName: SITE_NAME,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${SITE_URL}/cartas-al-director` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Cartas al Director | ${SITE_NAME}`,
        description: `Cartas al director enviadas por las lectoras y lectores de ${SITE_NAME}.`,
        url: `${SITE_URL}/cartas-al-director`,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.webp` },
        },
      }),
    },
  ],
})
</script>
