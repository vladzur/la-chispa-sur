<!-- pages/contacto.vue -->
<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-extrabold text-text-heading font-sans mb-8">Contacto</h1>

    <section class="prose prose-lg max-w-none text-text-body font-serif leading-relaxed space-y-6 mb-12">
      <p>
        En <strong>La Chispa Sur</strong> valoramos la comunicación directa con nuestras lectoras y lectores.
        Si tienes información que quieras compartir, una denuncia, comentarios sobre nuestras publicaciones
        o deseas colaborar con el medio, no dudes en escribirnos.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Correo Electrónico</h2>
      <p>
        Puedes contactarnos a través de nuestro correo oficial:
      </p>
      <p class="text-xl">
        <a href="mailto:contacto@lachispasur.cl" class="text-primary hover:underline font-semibold">
          contacto@lachispasur.cl
        </a>
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Redes Sociales</h2>
      <p>También puedes encontrarnos y enviarnos mensajes a través de nuestras redes sociales:</p>
      <ul class="list-disc ml-6 space-y-2">
        <li>
          <strong>Facebook:</strong>
          <a href="https://www.facebook.com/profile.php?id=61585201206673" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
            La Chispa Sur
          </a>
        </li>
        <li>
          <strong>Instagram:</strong>
          <a href="https://www.instagram.com/la_chispa_sur" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
            @la_chispa_sur
          </a>
        </li>
      </ul>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Información y Denuncias</h2>
      <p>
        Si tienes información de interés periodístico que quieras compartir de manera confidencial,
        escríbenos a <a href="mailto:contacto@lachispasur.cl" class="text-primary hover:underline">contacto@lachispasur.cl</a>.
        Tratamos todas las comunicaciones con la debida reserva y protegemos a nuestras fuentes.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Colaboraciones</h2>
      <p>
        Si eres periodista, columnista, fotógrafo o trabajador de las comunicaciones y quieres colaborar
        con La Chispa Sur, envíanos tu propuesta a <a href="mailto:contacto@lachispasur.cl" class="text-primary hover:underline">contacto@lachispasur.cl</a>
        incluyendo una breve presentación y ejemplos de tu trabajo.
      </p>

      <h2 class="text-2xl font-bold text-text-heading font-sans">Soporte Técnico</h2>
      <p>
        Si encuentras algún problema técnico en nuestro sitio web, por favor repórtalo a
        <a href="mailto:contacto@lachispasur.cl" class="text-primary hover:underline">contacto@lachispasur.cl</a>
        describiendo el inconveniente y el navegador/dispositivo que utilizas.
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
  title: 'Contacto',
  description: `Comunícate con ${SITE_NAME}. Información de contacto, redes sociales, denuncias confidenciales y colaboraciones periodísticas.`,
  ogType: 'website',
  ogUrl: `${SITE_URL}/contacto`,
  ogTitle: `Contacto | ${SITE_NAME}`,
  ogDescription: `Comunícate con ${SITE_NAME}. Información de contacto, redes sociales y colaboraciones.`,
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
        '@type': 'ContactPage',
        name: `Contacto | ${SITE_NAME}`,
        description: `Información de contacto y soporte de ${SITE_NAME}. Periodismo independiente desde La Araucanía.`,
        url: `${SITE_URL}/contacto`,
        about: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          email: 'contacto@lachispasur.cl',
        },
      }),
    },
  ],
})
</script>
