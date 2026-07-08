<!-- pages/linea-editorial.vue -->
<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-extrabold text-text-heading font-sans mb-8">Línea Editorial</h1>

    <section class="prose prose-lg max-w-none text-text-body font-serif leading-relaxed space-y-6 mb-12">
      <p>
        La línea editorial de <strong>La Chispa Sur</strong> define los principios, valores y criterios que guían
        nuestro trabajo periodístico. Es pública y transparente porque creemos que los medios debemos rendir
        cuentas a nuestras audiencias.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">1. Perspectiva Editorial</h2>
      <p>
        <strong>La Chispa Sur</strong> se define como un medio con perspectiva de izquierda. Esto significa que:
      </p>
      <ul class="list-disc ml-6 space-y-2">
        <li>Abordamos la realidad desde un enfoque de clase, reconociendo las desigualdades estructurales que atraviesan la sociedad chilena.</li>
        <li>Priorizamos la cobertura de temáticas sociales, laborales, ambientales y de derechos humanos desde el punto de vista de las comunidades afectadas.</li>
        <li>Cuestionamos las estructuras de poder económico, político y mediático, y ejercemos un periodismo de fiscalización.</li>
        <li>Promovemos el debate democrático y la pluralidad de voces dentro del campo popular y de izquierda.</li>
      </ul>

      <h2 class="text-2xl font-bold text-text-heading font-sans">2. Rigor y Veracidad</h2>
      <p>
        Nos comprometemos a verificar toda la información que publicamos. Contrastamos fuentes, chequeamos datos
        y corregimos de manera transparente cuando cometemos errores. La credibilidad es nuestro activo más valioso.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">3. Independencia</h2>
      <p>
        <strong>La Chispa Sur</strong> no está afiliada a ningún partido político ni recibe financiamiento de
        grupos que condicionen nuestra cobertura. Nuestra independencia editorial es innegociable.
        Cuando existan alianzas comerciales o colaboraciones que pudieran generar conflictos de interés,
        los declararemos de forma explícita.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">4. Separación entre Opinión e Información</h2>
      <p>
        Distinguimos claramente entre:
      </p>
      <ul class="list-disc ml-6 space-y-2">
        <li><strong>Notas informativas:</strong> hechos verificables presentados con contexto, equilibrio y rigurosidad.</li>
        <li><strong>Columnas de opinión:</strong> análisis y perspectivas personales de nuestros redactores y colaboradores, claramente identificadas como tales.</li>
      </ul>

      <h2 class="text-2xl font-bold text-text-heading font-sans">5. Enfoque Territorial</h2>
      <p>
        Cubrimos la realidad desde el sur de Chile, con especial atención a La Araucanía, Los Ríos y las
        regiones históricamente postergadas por el centralismo mediático. Creemos que el periodismo local
        y regional es esencial para una democracia saludable.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">6. Derechos Humanos y Democracia</h2>
      <p>
        Nuestra cobertura se enmarca en el respeto irrestricto a los derechos humanos, la defensa del régimen
        democrático y la condena a toda forma de autoritarismo, censura o violencia política. Cubrimos con
        especial atención las demandas de los pueblos originarios y las luchas por la memoria, verdad y justicia.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const SITE_NAME = config.public.siteName
const SITE_URL = config.public.siteUrl

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Línea Editorial',
  description: `Principios, valores y criterios que guían el trabajo periodístico de ${SITE_NAME}. Periodismo con perspectiva de izquierda, independiente y territorial.`,
  ogType: 'website',
  ogUrl: `${SITE_URL}/linea-editorial`,
  ogTitle: `Línea Editorial | ${SITE_NAME}`,
  ogDescription: `Principios, valores y criterios que guían el trabajo periodístico de ${SITE_NAME}.`,
  ogImage: `${SITE_URL}/logo.webp`,
  ogSiteName: SITE_NAME,
  twitterCard: 'summary_large_image',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Línea Editorial | ${SITE_NAME}`,
        description: `Principios, valores y criterios que guían el trabajo periodístico de ${SITE_NAME}.`,
        url: `${SITE_URL}/linea-editorial`,
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
        },
      }),
    },
  ],
})
</script>
