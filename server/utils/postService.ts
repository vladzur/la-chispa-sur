// server/utils/postService.ts
// Lógica de Firestore server-side usando Admin SDK
// Reemplaza src/services/postService.ts (que usaba Client SDK)
import { getAdminDb } from './firebaseAdmin'
import type { DocumentSnapshot } from 'firebase-admin/firestore'

export interface Post {
  id: string
  slug?: string
  title: string
  content: string
  headerImageUrl: string
  authorId: string
  authorName?: string
  // ISO strings — ya NO son Firestore Timestamps (son serializables para Nuxt payload)
  createdAt: string
  updatedAt: string
  published?: boolean
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
    authorId: data.authorId ?? '',
    authorName: data.authorName ?? null,
    published: data.published ?? true,
    kudosCount: data.kudosCount ?? 0,
    category: data.category ?? 'Actualidad',
    isFeatured: data.isFeatured ?? false,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? '',
  }
}

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
 */
export const getPublishedPosts = async (): Promise<Post[]> => {
  const db = getAdminDb()

  // Nota: el filtro `published != false` requiere índice compuesto con createdAt.
  // Alternativa más simple y sin índice: filtrar en memoria.
  const snapshot = await db
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs
    .map(toPost)
    .filter((p) => p.published !== false)
}

/**
 * Lista posts publicados filtrados por categoría.
 */
export const getPostsByCategory = async (category: string): Promise<Post[]> => {
  const db = getAdminDb()
  const snapshot = await db
    .collection('posts')
    .where('category', '==', category)
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs
    .map(toPost)
    .filter((p) => p.published !== false)
}

/**
 * Posts de un autor específico (para el dashboard del editor).
 */
export const getPostsByAuthor = async (authorId: string): Promise<Post[]> => {
  const db = getAdminDb()
  const snapshot = await db
    .collection('posts')
    .where('authorId', '==', authorId)
    .orderBy('createdAt', 'desc')
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
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(toPost)
}
