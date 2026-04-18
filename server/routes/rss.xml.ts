// server/routes/rss.xml.ts
// Reemplaza la Firebase Function generateRss
// Accesible en: GET /rss.xml
import { getPublishedPosts } from '~/server/utils/postService'

const escapeXml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()

export default defineEventHandler(async (event) => {
  const SITE_URL = 'https://lachispasur.cl'

  try {
    const posts = await getPublishedPosts()
    const latest = posts.slice(0, 50)

    const items = latest
      .map((p) => {
        const url = `${SITE_URL}/post/${p.slug || p.id}`
        const title = escapeXml(p.title || 'Noticia')
        const description = escapeXml(stripHtml(p.content).substring(0, 300) + '...')
        const pubDate = p.createdAt ? new Date(p.createdAt).toUTCString() : ''
        return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${description}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
    </item>`
      })
      .join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>La Chispa Sur</title>
    <link>${SITE_URL}</link>
    <description>Noticias e ideas desde el sur</description>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>es</language>${items}
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
