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

const postsCollection = collection(db, 'posts');

export const getPosts = async (): Promise<Post[]> => {
  const q = query(postsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Post));
};

export const getPost = async (id: string): Promise<Post | null> => {
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
  return newPostRef.id;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<void> => {
  const docRef = doc(db, 'posts', id);
  await updateDoc(docRef, {
    ...postData,
    updatedAt: serverTimestamp()
  });
};

export const deletePost = async (id: string): Promise<void> => {
  const docRef = doc(db, 'posts', id);
  await deleteDoc(docRef);
};
