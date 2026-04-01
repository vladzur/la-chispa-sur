import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getPosts, getPost, invalidateCache, createPost, updatePost, deletePost } from './postService';
import { getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

describe('Post Service', () => {

  const MOCK_TIMESTAMP = { toDate: () => new Date('2026-04-01T12:00:00Z') };

  const fakeDocs = [
    {
      id: 'post1',
      data: () => ({
        title: 'Title 1',
        content: 'Content 1',
        createdAt: MOCK_TIMESTAMP,
        updatedAt: MOCK_TIMESTAMP
      })
    },
    {
      id: 'post2',
      data: () => ({
        title: 'Title 2',
        content: 'Content 2',
        createdAt: MOCK_TIMESTAMP,
        updatedAt: MOCK_TIMESTAMP
      })
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache(); // Ensure fresh cache start
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches posts from firestore and maps them correctly', async () => {
    (getDocs as any).mockResolvedValue({ docs: fakeDocs });

    const posts = await getPosts();

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(posts.length).toBe(2);
    expect(posts[0].id).toBe('post1');
    expect(posts[0].title).toBe('Title 1');
    // Ensure serialization of timestamps occurred logically for testing
  });

  it('uses cache and does not call firestore multiple times within TTL', async () => {
    (getDocs as any).mockResolvedValue({ docs: fakeDocs });

    // Primera llamada - va a Firestore
    await getPosts();
    expect(getDocs).toHaveBeenCalledTimes(1);

    // Avanzamos 5 minutos en el tiempo
    vi.advanceTimersByTime(5 * 60 * 1000);

    // Segunda llamada - debe venir de caché, no aumentar la cuenta de getDocs
    const cachedPosts = await getPosts();
    expect(getDocs).toHaveBeenCalledTimes(1); // Mantiene 1 llamada
    expect(cachedPosts.length).toBe(2);

    // Forzamos actualización por bypass del administrador
    await getPosts(true);
    expect(getDocs).toHaveBeenCalledTimes(2); // Debería haber subido a 2
  });

  it('invalidates cache when a new post is updated or created', async () => {
    (getDocs as any).mockResolvedValue({ docs: fakeDocs });

    await getPosts();
    expect(getDocs).toHaveBeenCalledTimes(1);

    // Creamos la noticia: debe borrar caché
    (setDoc as any).mockResolvedValue(undefined);
    await createPost({ title: 'New', content: '', headerImageUrl: '', authorId: '1' } as any);

    // Leer noticias nuevamente, como se creó una noticia la caché voló
    await getPosts();
    expect(getDocs).toHaveBeenCalledTimes(2); // Se vio obligado a repedir firestore
  });

  it('getPost retrieves individual post from cache if fetched globally', async () => {
    (getDocs as any).mockResolvedValue({ docs: fakeDocs });
    (getDoc as any).mockResolvedValue({
      id: 'post99',
      exists: () => true,
      data: () => ({ title: 'Single' })
    });

    // Carga general de posts a caché
    await getPosts();

    // Buscar "post1", debería salir de la caché en memoria y NO tocar getDoc de Firestore
    const p1 = await getPost('post1');
    expect(p1?.title).toBe('Title 1');
    expect(getDoc).toHaveBeenCalledTimes(0);

    // Buscar un post que NO está en cache ("post99"), debería forzar a tocar getDoc
    const p99 = await getPost('post99');
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(p99?.title).toBe('Single');
  });

});
