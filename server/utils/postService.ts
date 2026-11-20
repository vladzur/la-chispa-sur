// server/utils/postService.ts
// Lógica de Firestore server-side usando Admin SDK
// Reemplaza src/services/postService.ts (que usaba Client SDK)
import { getAdminDb } from './firebaseAdmin'
import type { DocumentSnapshot, Query } from 'firebase-admin/firestore'

/** Tamaño de página por defecto y tope duro para las listas públicas. */
export const PAGE_DEFAULT = 12
export const PAGE_MAX = 50

export interface PageOpts {
  limit?: number
  cursor?: string
  category?: string
}

export interface PostPage {
  items: Post[]
  nextCursor: string | null
}

export interface Post {
  id: string
  slug?: string
  title: string
  content: string
  headerImageUrl: string
  headerImageAlt?: string | null
  authorId: string
  authorName?: string
  // ISO strings — ya NO son Firestore Timestamps (son serializables para Nuxt payload)
  createdAt: string
  updatedAt: string
  published?: boolean
  publishDate: string  // ISO string — siempre poblado. Iguala createdAt para posts legacy.
  kudosCount?: number
  category?: string
  isFeatured?: boolean
}

/**
 * Convierte un DocumentSnapshot de Admin SDK a nuestro tipo Post serializable.
 * Los Timestamps de Firestore se convierten a strings ISO.
 */
const toPost = (docSnap: DocumentSnapshot): Post => {
  const data = docSnap.data()!
  return {
    id: docSnap.id,
    slug: data.slug ?? null,
    title: data.title ?? '',
    content: data.content ?? '',
    headerImageUrl: data.headerImageUrl ?? '',
    headerImageAlt: data.headerImageAlt ?? null,
    authorId: data.authorId ?? '',
    authorName: data.authorName ?? null,
    published: data.published ?? true,
    publishDate: data.publishDate?.toDate?.().toISOString() ?? data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    kudosCount: data.kudosCount ?? 0,
    category: data.category ?? 'Actualidad',
    isFeatured: data.isFeatured ?? false,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? '',
  }
}

/**
 * Determina si un post debe ser visible al público.
 * Un post es visible si está publicado (published !== false) y su fecha de
 * publicación ya se cumplió (publishDate <= ahora).
 */
const isPubliclyVisible = (p: Post): boolean =>
  p.published !== false && new Date(p.publishDate) <= new Date()

/**
 * Búsqueda dual: primero por slug, luego por ID de documento (retrocompatibilidad).
 * Solo retorna posts publicados (a menos que sea admin — la verificación es en la API route).
 */
export const getPostBySlugOrId = async (slugOrId: string): Promise<Post | null> => {
  const db = getAdminDb()

  // 1. Intentar por slug (campo indexado)
  const slugQuery = await db
    .collection('posts')
    .where('slug', '==', slugOrId)
    .limit(1)
    .get()

  if (!slugQuery.empty) {
    const snap = slugQuery.docs[0]
    return toPost(snap)
  }

  // 2. Fallback por ID de documento (URLs antiguas)
  const docSnap = await db.collection('posts').doc(slugOrId).get()
  if (docSnap.exists) return toPost(docSnap)

  return null
}

/**
 * Lista todos los posts publicados ordenados por fecha descendente.
 * Uso interno (sitemap, RSS): necesitan el corpus completo para generar URLs.
 * No se expone como API pública; para eso está getPublishedPostsPage().
 */
export const getPublishedPosts = async (): Promise<Post[]> => {
  const db = getAdminDb()

  // Ordenamos por publishDate (fecha de publicación) para que las noticias
  // programadas aparezcan en el orden correcto al cumplirse su fecha.
  // El filtro de visibilidad se hace en memoria para evitar índices compuestos.
  const snapshot = await db
    .collection('posts')
    .orderBy('publishDate', 'desc')
    .get()

  return snapshot.docs
    .map(toPost)
    .filter(isPubliclyVisible)
}

/**
 * Página de posts públicos: filtra `published` y la fecha de publicación
 * EN LA CONSULTA (no en memoria) y pagina con cursor sobre `publishDate`.
 *
 * Requiere los índices compuestos declarados en `firestore.indexes.json`:
 *   posts: published ASC, publishDate DESC
 *   posts: published ASC, category ASC, publishDate DESC
 */
export const getPublishedPostsPage = async (opts: PageOpts = {}): Promise<PostPage> => {
  const db = getAdminDb()
  const limit = Math.min(Math.max(opts.limit ?? PAGE_DEFAULT, 1), PAGE_MAX)

  let q: Query = db
    .collection('posts')
    .where('published', '==', true)
    .where('publishDate', '<=', new Date())
    .orderBy('publishDate', 'desc')

  if (opts.category) q = q.where('category', '==', opts.category)

  if (opts.cursor) {
    const cursorDate = new Date(opts.cursor)
    // Cursor inválido: se ignora y se empieza desde la primera página
    if (!Number.isNaN(cursorDate.getTime())) q = q.startAfter(cursorDate)
  }

  // +1 para saber si hay página siguiente sin un count extra
  const snapshot = await q.limit(limit + 1).get()
  const docs = snapshot.docs.slice(0, limit)
  const hasMore = snapshot.docs.length > limit
  const lastDate = docs[docs.length - 1]?.get('publishDate')

  return {
    items: docs.map(toPost),
    nextCursor: hasMore && typeof lastDate?.toDate === 'function'
      ? lastDate.toDate().toISOString()
      : null,
  }
}

/**
 * Posts publicados de una categoría, filtrados y acotados en la consulta.
 * El tope es PAGE_MAX (50), muy por encima del mayor volumen actual por
 * categoría (19), así que hoy no recorta nada visible.
 */
export const getPostsByCategory = async (category: string, limit = PAGE_MAX): Promise<Post[]> => {
  const db = getAdminDb()
  const cap = Math.min(Math.max(limit, 1), PAGE_MAX)

  const snapshot = await db
    .collection('posts')
    .where('category', '==', category)
    .where('published', '==', true)
    .where('publishDate', '<=', new Date())
    .orderBy('publishDate', 'desc')
    .limit(cap)
    .get()

  return snapshot.docs.map(toPost)
}

/**
 * Posts de un autor específico (para el dashboard del editor).
 */
export const getPostsByAuthor = async (authorId: string): Promise<Post[]> => {
  const db = getAdminDb()
  const snapshot = await db
    .collection('posts')
    .where('authorId', '==', authorId)
    .orderBy('publishDate', 'desc')
    .get()
  return snapshot.docs.map(toPost)
}

/**
 * Todos los posts incluyendo borradores — para uso exclusivo del dashboard admin.
 */
export const getAllPosts = async (): Promise<Post[]> => {
  const db = getAdminDb()
  const snapshot = await db
    .collection('posts')
    .orderBy('publishDate', 'desc')
    .get()
  return snapshot.docs.map(toPost)
}
