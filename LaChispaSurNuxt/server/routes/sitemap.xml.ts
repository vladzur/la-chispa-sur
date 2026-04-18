// server/routes/sitemap.xml.ts
// Reemplaza la Firebase Function generateSitemap
// Accesible en: GET /sitemap.xml
import { getPublishedPosts } from '~/server/utils/postService'

export default defineEventHandler(async (event) => {
  const SITE_URL = 'https://lachispasur.cl'

  try {
    const posts = await getPublishedPosts()

    const postUrls = posts
      .map((p) => {
        const loc = `${SITE_URL}/post/${p.slug || p.id}`
        const lastmod = p.updatedAt ? p.updatedAt.split('T')[0] : ''
        return `
  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
      })
      .join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${postUrls}
</urlset>`

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return xml
  } catch (error) {
    console.error('[sitemap.xml] Error:', error)
    throw createError({ statusCode: 500, message: 'Error generando sitemap' })
  }
})
