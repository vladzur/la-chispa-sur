// server/utils/letterService.ts
// Lógica de Firestore server-side para la colección 'letters' (Cartas al Director)
// usando Admin SDK. Espejo de postService.ts
import { getAdminDb } from './firebaseAdmin'
import type { DocumentSnapshot } from 'firebase-admin/firestore'

export interface Letter {
  id: string
  slug?: string
  title: string
  content: string
  senderName: string
  senderCity: string
  authorId: string
  authorName?: string
  // ISO strings — ya NO son Firestore Timestamps (son serializables para Nuxt payload)
  createdAt: string
  updatedAt: string
  published?: boolean
  publishDate: string  // ISO string — siempre poblado. Soporta publicación programada.
}

/**
 * Convierte un DocumentSnapshot de Admin SDK a nuestro tipo Letter serializable.
 * Los Timestamps de Firestore se convierten a strings ISO.
 */
const toLetter = (docSnap: DocumentSnapshot): Letter => {
  const data = docSnap.data()!
  return {
    id: docSnap.id,
    slug: data.slug ?? null,
    title: data.title ?? '',
    content: data.content ?? '',
    senderName: data.senderName ?? '',
    senderCity: data.senderCity ?? '',
    authorId: data.authorId ?? '',
    authorName: data.authorName ?? null,
    published: data.published ?? true,
    publishDate: data.publishDate?.toDate?.().toISOString() ?? data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? '',
  }
}

/**
 * Determina si una carta debe ser visible al público.
 * Una carta es visible si está publicada (published !== false) y su fecha de
 * publicación ya se cumplió (publishDate <= ahora).
 */
const isPubliclyVisible = (l: Letter): boolean =>
  l.published !== false && new Date(l.publishDate) <= new Date()

/**
 * Búsqueda dual: primero por slug, luego por ID de documento (retrocompatibilidad).
 * Solo retorna cartas publicadas (a menos que sea admin — la verificación es en la API route).
 */
export const getLetterBySlugOrId = async (slugOrId: string): Promise<Letter | null> => {
  const db = getAdminDb()

  // 1. Intentar por slug (campo indexado)
  const slugQuery = await db
    .collection('letters')
    .where('slug', '==', slugOrId)
    .limit(1)
    .get()

  if (!slugQuery.empty) {
    const snap = slugQuery.docs[0]
    return toLetter(snap)
  }

  // 2. Fallback por ID de documento (URLs antiguas)
  const docSnap = await db.collection('letters').doc(slugOrId).get()
  if (docSnap.exists) return toLetter(docSnap)

  return null
}

/**
 * Lista todas las cartas publicadas ordenadas por fecha descendente.
 */
export const getPublishedLetters = async (): Promise<Letter[]> => {
  const db = getAdminDb()

  // Ordenamos por publishDate para que las cartas programadas aparezcan en el
  // orden correcto al cumplirse su fecha. El filtro de visibilidad se hace en
  // memoria para evitar índices compuestos.
  const snapshot = await db
    .collection('letters')
    .orderBy('publishDate', 'desc')
    .get()

  return snapshot.docs
    .map(toLetter)
    .filter(isPubliclyVisible)
}

/**
 * Todas las cartas incluyendo borradores — para uso exclusivo del dashboard admin.
 */
export const getAllLetters = async (): Promise<Letter[]> => {
  const db = getAdminDb()
  const snapshot = await db
    .collection('letters')
    .orderBy('publishDate', 'desc')
    .get()
  return snapshot.docs.map(toLetter)
}
