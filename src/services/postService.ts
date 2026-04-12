import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp, increment, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Post {
  id: string;
  slug?: string;
  title: string;
  content: string; // HTML from rich text editor
  headerImageUrl: string;
  authorId: string;
  authorName?: string;
  createdAt: any;
  updatedAt: any;
  published?: boolean;
  kudosCount?: number;
}

/**
 * Genera un slug URL-safe a partir de un título en español.
 * Normaliza acentos, convierte a minúsculas, reemplaza espacios por guiones
 * y añade un sufijo aleatorio de 4 caracteres para garantizar unicidad.
 *
 * Ejemplo: "Incendio en la Región del Biobío" → "incendio-en-la-region-del-biobio-a3f7"
 */
export const generateSlug = (title: string): string => {
  const base = title
    .normalize('NFD')                   // separa acentos del carácter base
    .replace(/[\u0300-\u036f]/g, '')    // elimina marcas diacríticas (tildes)
    .toLowerCase()
    .replace(/ñ/g, 'n')                 // ñ → n (antes de eliminar especiales)
    .replace(/[^a-z0-9\s-]/g, '')       // elimina caracteres no alfanuméricos
    .trim()
    .replace(/\s+/g, '-')              // espacios → guiones
    .replace(/-+/g, '-')               // múltiples guiones → uno
    .substring(0, 60);                 // máximo 60 caracteres

  const suffix = Math.random().toString(36).substring(2, 6); // 4 chars aleatorios
  return `${base}-${suffix}`;
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const SESSION_CACHE_KEY = 'lachispasur_posts_cache';

interface CacheData {
  posts: Post[];
  lastFetch: number;
}

let memoryCache: CacheData | null = null;

const loadCache = (): CacheData | null => {
  if (memoryCache) return memoryCache;
  const stored = sessionStorage.getItem(SESSION_CACHE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as CacheData;
      if (Date.now() - parsed.lastFetch < CACHE_TTL) {
        memoryCache = parsed;
        return parsed;
      } else {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
      }
    } catch (e) {
      console.error('Failed to parse cache', e);
    }
  }
  return null;
};

const saveCache = (posts: Post[]) => {
  // Convert Firestore Timestamps to numbers (milliseconds) for safe serialization
  const serializablePosts = posts.map(p => ({
    ...p,
    createdAt: p.createdAt?.toDate ? p.createdAt.toDate().getTime() : p.createdAt,
    updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().getTime() : p.updatedAt
  }));
  const cacheData = { posts: serializablePosts, lastFetch: Date.now() };
  memoryCache = cacheData;
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData));
};

export const invalidateCache = () => {
  memoryCache = null;
  sessionStorage.removeItem(SESSION_CACHE_KEY);
};

const postsCollection = collection(db, 'posts');

export const getPosts = async (forceRefresh = false): Promise<Post[]> => {
  if (!forceRefresh) {
    const cache = loadCache();
    if (cache) return cache.posts;
  }

  const q = query(postsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Post));
  
  saveCache(posts);
  return posts;
};

/**
 * Búsqueda de post por slug (campo en Firestore).
 * Primero revisa el caché en memoria, luego hace query a Firestore.
 */
export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  // Revisar caché primero
  const cache = loadCache();
  if (cache) {
    const found = cache.posts.find(p => p.slug === slug);
    if (found) return found;
  }
  // Query a Firestore por el campo slug
  const q = query(postsCollection, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Post;
  }
  return null;
};

/**
 * Obtiene un post por slug o por ID de Firestore (búsqueda dual).
 * Primero intenta encontrar el post como slug; si no lo encuentra,
 * lo busca directamente como ID de documento (retrocompatibilidad con URLs antiguas).
 */
export const getPost = async (slugOrId: string, forceRefresh = false): Promise<Post | null> => {
  if (!forceRefresh) {
    const cache = loadCache();
    if (cache) {
      // Buscar por slug o por ID en caché
      const found = cache.posts.find(p => p.slug === slugOrId || p.id === slugOrId);
      if (found) return found;
    }
  }

  // 1. Intentar búsqueda por slug en Firestore
  const bySlug = await getPostBySlug(slugOrId);
  if (bySlug) return bySlug;

  // 2. Fallback: buscar directamente por ID de documento (URLs antiguas)
  const docRef = doc(db, 'posts', slugOrId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Post;
  }

  return null;
};

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newPostRef = doc(postsCollection); // auto-generate ID
  // Generar slug automático desde el título si no se provee uno
  const slug = post.slug || generateSlug(post.title);
  await setDoc(newPostRef, {
    ...post,
    slug,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  invalidateCache();
  return newPostRef.id;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<void> => {
  const docRef = doc(db, 'posts', id);
  await updateDoc(docRef, {
    ...postData,
    updatedAt: serverTimestamp()
  });
  invalidateCache();
};

export const deletePost = async (id: string): Promise<void> => {
  const docRef = doc(db, 'posts', id);
  await deleteDoc(docRef);
  invalidateCache();
};

/**
 * Obtiene los posts de un autor específico (para uso del editor en su dashboard).
 * Siempre consulta Firestore directamente, sin caché.
 */
export const getPostsByAuthor = async (authorId: string): Promise<Post[]> => {
  const q = query(postsCollection, where('authorId', '==', authorId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
};

export const addKudos = async (postId: string, amount: number): Promise<void> => {
  const docRef = doc(db, 'posts', postId);
  await updateDoc(docRef, { kudosCount: increment(amount) });

  // Patch in-memory cache to keep the UI in sync without a full refetch
  if (memoryCache) {
    const idx = memoryCache.posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      memoryCache.posts[idx] = {
        ...memoryCache.posts[idx],
        kudosCount: (memoryCache.posts[idx].kudosCount ?? 0) + amount
      };
    }
  }
};
