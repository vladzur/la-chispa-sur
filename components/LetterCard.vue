<!-- components/LetterCard.vue — Tarjeta de carta al director para el listado público -->
<template>
  <article class="bg-white border border-gray-100 rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
    <NuxtLink :to="letterUrl">
      <h2 class="text-2xl font-bold font-sans text-text-heading hover:text-primary transition-colors mb-3">
        {{ letter.title }}
      </h2>
    </NuxtLink>

    <p class="text-text-body font-serif leading-relaxed line-clamp-3 mb-4">
      {{ excerpt }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span class="italic text-gray-600 font-serif">— {{ signature }}</span>
      <time :datetime="letter.publishDate" class="text-gray-500 font-sans">{{ formattedDate }}</time>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Letter } from '~/types/letter'

const props = defineProps<{ letter: Letter }>()

const letterUrl = computed(() => `/cartas-al-director/${props.letter.slug || props.letter.id}`)
const signature = computed(() => formatLetterSignature(props.letter.senderName, props.letter.senderCity))
const excerpt = computed(() => getLetterExcerpt(props.letter.content))

const formattedDate = computed(() => {
  if (!props.letter.publishDate) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(props.letter.publishDate))
})
</script>
