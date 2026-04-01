import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Post {
  id: string;
  title: string;
  content: string; // HTML from rich text editor
  headerImageUrl: string;
  authorId: string;
  authorName?: string;
  createdAt: any;
  updatedAt: any;
}

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

export const getPost = async (id: string, forceRefresh = false): Promise<Post | null> => {
  if (!forceRefresh) {
    const cache = loadCache();
    if (cache) {
      const found = cache.posts.find(p => p.id === id);
      if (found) return found;
    }
  }
  const docRef = doc(db, 'posts', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Post;
  }
  return null;
};

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newPostRef = doc(postsCollection); // auto-generate ID
  await setDoc(newPostRef, {
    ...post,
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
