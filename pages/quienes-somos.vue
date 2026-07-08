<!-- pages/quienes-somos.vue -->
<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-extrabold text-text-heading font-sans mb-8">Quiénes Somos</h1>

    <section class="prose prose-lg max-w-none text-text-body font-serif leading-relaxed space-y-6 mb-12">
      <h2 class="text-2xl font-bold text-text-heading font-sans">Nuestra Misión</h2>
      <p>
        <strong>La Chispa Sur</strong> es un medio de periodismo digital independiente con base en la Región de La Araucanía.
        Nacimos con el propósito de ofrecer una cobertura crítica, territorial y con perspectiva de izquierda sobre la realidad
        nacional, regional y local.
      </p>
      <p>
        Creemos en un periodismo que incomoda al poder, que fiscaliza a las instituciones y que da voz a quienes
        históricamente han sido silenciados. Nuestra misión es informar con rigor, contextualizar los hechos y
        contribuir al debate público desde el sur de Chile.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Nuestra Visión</h2>
      <p>
        Aspiramos a consolidarnos como un medio de referencia en el periodismo independiente del sur de Chile,
        reconocido por su calidad editorial, su compromiso con la verdad y su capacidad de generar impacto
        en la agenda pública.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Nuestro Equipo</h2>
      <p>
        <strong>Vladimir Zurita</strong> — Fundador, Editor General y Redactor principal. Apasionado por entregar información
        y analizar críticamente los acontecimientos desde una mirada territorial y de izquierda. No ostenta título de periodismo,
        pero ejerce una labor informativa comprometida con la verdad y la fiscalización del poder.
      </p>
      <p>
        La Chispa Sur se nutre también de colaboradores, columnistas y fuentes territoriales que enriquecen
        nuestra cobertura desde distintas comunas de La Araucanía y el sur de Chile.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Nuestros Principios</h2>
      <ul class="list-disc ml-6 space-y-2">
        <li><strong>Independencia editorial:</strong> No recibimos financiamiento de partidos políticos ni de grupos económicos que comprometan nuestra línea editorial.</li>
        <li><strong>Compromiso territorial:</strong> Creemos que el periodismo debe estar arraigado al territorio que cubre, conociendo sus problemáticas y a sus comunidades.</li>
        <li><strong>Transparencia:</strong> Nuestras fuentes de financiamiento, nuestra metodología de trabajo y nuestra línea editorial son públicas y accesibles.</li>
        <li><strong>Perspectiva crítica:</strong> Abordamos la realidad desde una mirada de izquierda, con conciencia de clase y compromiso con la justicia social.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const SITE_NAME = config.public.siteName
const SITE_URL = config.public.siteUrl

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Quiénes Somos',
  description: `Conoce la misión, visión y el equipo detrás de ${SITE_NAME}. Periodismo independiente y crítico desde La Araucanía, Chile.`,
  ogType: 'website',
  ogUrl: `${SITE_URL}/quienes-somos`,
  ogTitle: `Quiénes Somos | ${SITE_NAME}`,
  ogDescription: `Conoce la misión, visión y el equipo detrás de ${SITE_NAME}. Periodismo independiente y crítico desde La Araucanía, Chile.`,
  ogImage: `${SITE_URL}/logo.webp`,
  ogSiteName: SITE_NAME,
  twitterCard: 'summary_large_image',
})

// JSON-LD Organization con sameAs para E-E-A-T
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.webp`,
        description: 'Periodismo digital independiente y crítico desde La Araucanía, Chile.',
        foundingDate: '2024',
        founder: {
          '@type': 'Person',
          name: 'Vladimir Zurita',
        },
        sameAs: [
          'https://www.facebook.com/profile.php?id=61585201206673',
          'https://www.instagram.com/la_chispa_sur',
        ],
      }),
    },
  ],
})
</script>
