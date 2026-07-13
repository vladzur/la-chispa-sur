// server/routes/rss.xml.ts
// Feed RSS compatible con Google News
// Accesible en: GET /rss.xml
import { getPublishedPosts } from '~/server/utils/postService'

const SITE_URL = 'https://lachispasur.cl'
const SITE_NAME = 'La Chispa Sur'
const SITE_DESCRIPTION = 'Noticias e ideas desde el sur'
const MAX_ITEMS = 50
const DESCRIPTION_MAX_LENGTH = 300

// ---------------------------------------------------------------------------
// Helpers de escape y limpieza de texto
// ---------------------------------------------------------------------------

/** Escapa caracteres especiales XML en texto plano */
const escapeXml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

/**
 * Elimina tags HTML y decodifica entidades básicas para obtener texto plano.
 * Es un enfoque naive con regex; suficiente para generar extractos legibles
 * en el feed RSS.
 */
const stripHtml = (html: string): string =>
  html
    // Eliminar tags HTML
    .replace(/<[^>]*>/g, '')
    // Decodificar entidades HTML comunes
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCodePoint(Number(n)))
    // Normalizar whitespace
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Trunca un texto a maxLength caracteres, cortando en el último espacio
 * para no partir palabras. Añade "…" si hubo truncamiento.
 */
const truncateText = (text: string, maxLength: number = DESCRIPTION_MAX_LENGTH): string =>
  text.length <= maxLength
    ? text
    : text.substring(0, maxLength).replace(/\s+\S*$/, '') + '…'

// ---------------------------------------------------------------------------
// Helpers de imágenes y MIME
// ---------------------------------------------------------------------------

/** Tabla de extensiones → MIME types para imágenes */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}

/** Infiere el MIME type desde la extensión del archivo en la URL */
const getMimeType = (url: string): string => {
  // Extraer extensión ignorando query strings
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
  return MIME_TYPES[ext] || 'image/jpeg'
}

/**
 * Genera el tag <enclosure> para una imagen.
 * Retorna string vacío si la URL no es válida.
 * Usa length="0" porque no tenemos acceso al tamaño real del archivo
 * sin hacer requests HTTP adicionales.
 */
const buildEnclosure = (imageUrl: string): string => {
  if (!imageUrl) return ''
  const mime = getMimeType(imageUrl)
  // Aseguramos URL absoluta para imágenes relativas
  const absoluteUrl = imageUrl.startsWith('/') ? `${SITE_URL}${imageUrl}` : imageUrl
  return `<enclosure url="${escapeXml(absoluteUrl)}" type="${mime}" length="0" />`
}

/**
 * Genera el tag <media:content> para enriquecer metadata de imagen.
 * Retorna string vacío si la URL no es válida.
 */
const buildMediaContent = (imageUrl: string, altText?: string | null): string => {
  if (!imageUrl) return ''
  const mime = getMimeType(imageUrl)
  const absoluteUrl = imageUrl.startsWith('/') ? `${SITE_URL}${imageUrl}` : imageUrl
  const alt = altText ? `\n      <media:description type="plain">${escapeXml(altText)}</media:description>` : ''
  return `<media:content url="${escapeXml(absoluteUrl)}" type="${mime}" medium="image">${alt}
    </media:content>`
}

// ---------------------------------------------------------------------------
// Generación del feed
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  try {
    const posts = await getPublishedPosts()
    const latest = posts.slice(0, MAX_ITEMS)
    const buildDate = new Date().toUTCString()

    // Generar XML para cada post
    const items = latest
      .map((p) => {
        const url = `${SITE_URL}/post/${p.slug || p.id}`
        const title = escapeXml(p.title || 'Noticia')
        const pubDate = new Date(p.publishDate).toUTCString()

        // Descripción: extracto de texto plano truncado, en CDATA
        const plainText = stripHtml(p.content)
        const excerpt = truncateText(plainText)
        const description = `<![CDATA[${excerpt}]]>`

        // Autor: nombre del autor o fallback al nombre del sitio
        const creator = escapeXml(p.authorName || SITE_NAME)

        // Categoría del post
        const category = escapeXml(p.category || 'Actualidad')

        // Imagen: enclosure + media:content
        const enclosure = buildEnclosure(p.headerImageUrl)
        const mediaContent = buildMediaContent(p.headerImageUrl, p.headerImageAlt)

        return `    <item>
          <title>${title}</title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <pubDate>${pubDate}</pubDate>
          <dc:creator>${creator}</dc:creator>
          <description>${description}</description>
          <category>${category}</category>
          <source url="${SITE_URL}">${escapeXml(SITE_NAME)}</source>${enclosure ? `\n          ${enclosure}` : ''}${mediaContent ? `\n          ${mediaContent}` : ''}
        </item>`
      })
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>es-CL</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${SITE_URL}/logo.webp</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

    setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return xml
  } catch (error) {
    console.error('[rss.xml] Error:', error)
    throw createError({ statusCode: 500, message: 'Error generando RSS' })
  }
})
