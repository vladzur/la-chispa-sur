import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getPosts, getPost, getPostBySlug, generateSlug, invalidateCache, createPost, deletePost, getPostsByAuthor } from './postService';
import { getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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

    // Buscar "post1" por su ID: está en caché, no debe tocar getDocs ni getDoc
    const p1 = await getPost('post1');
    expect(p1?.title).toBe('Title 1');
    expect(getDoc).toHaveBeenCalledTimes(0);

    // Buscar "post99" que NO está en caché:
    // getPost intentará getPostBySlug (1x getDocs) y luego caerá al fallback getDoc
    (getDocs as any).mockResolvedValue({ docs: [], empty: true }); // slug no encontrado
    const p99 = await getPost('post99');
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(p99?.title).toBe('Single');
  });

});

// ── addKudos ──────────────────────────────────────────────────────────────────
import { addKudos } from './postService';
import { updateDoc } from 'firebase/firestore';

describe('addKudos', () => {

  const MOCK_TIMESTAMP = { toDate: () => new Date('2026-04-01T12:00:00Z') };

  const fakeDocsWithKudos = [
    {
      id: 'post1',
      data: () => ({
        title: 'Title 1',
        content: 'Content 1',
        kudosCount: 5,
        createdAt: MOCK_TIMESTAMP,
        updatedAt: MOCK_TIMESTAMP
      })
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache();
  });

  it('llama a updateDoc con increment para actualizar kudosCount en Firestore', async () => {
    const { increment } = await import('firebase/firestore');
    (updateDoc as any).mockResolvedValue(undefined);

    await addKudos('post1', 1);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    // Verifica que el segundo argumento contiene kudosCount con un valor increment
    const callArg = (updateDoc as any).mock.calls[0][1];
    expect(callArg).toHaveProperty('kudosCount');
    // El mock de increment devuelve un objeto con el field sentinel  
    expect(increment).toHaveBeenCalledWith(1);
  });

  it('parchea la caché en memoria sin necesidad de refetch a Firestore', async () => {
    (getDocs as any).mockResolvedValue({ docs: fakeDocsWithKudos });
    (updateDoc as any).mockResolvedValue(undefined);

    // Cargar caché primero
    const postsBefore = await getPosts();
    expect(postsBefore[0].kudosCount).toBe(5);

    // Dar 1 kudo
    await addKudos('post1', 1);

    // El caché en memoria debe reflejar +1 SIN llamar de nuevo a getDocs
    const postsAfter = await getPosts();
    expect(getDocs).toHaveBeenCalledTimes(1); // Solo la carga inicial
    expect(postsAfter[0].kudosCount).toBe(6); // Parcheado en memoria
  });

});

// ── generateSlug ──────────────────────────────────────────────────────────────

describe('generateSlug', () => {

  it('convierte el título a minúsculas y reemplaza espacios con guiones', () => {
    const slug = generateSlug('Hola Mundo');
    expect(slug).toMatch(/^hola-mundo-[a-z0-9]{4}$/);
  });

  it('normaliza acentos y tildes (á, é, í, ó, ú)', () => {
    const slug = generateSlug('Incendio en la Región del Biobío');
    expect(slug).toMatch(/^incendio-en-la-region-del-biobio-[a-z0-9]{4}$/);
  });

  it('convierte la ñ en n', () => {
    const slug = generateSlug('Año Nuevo en España');
    expect(slug).toMatch(/^ano-nuevo-en-espana-[a-z0-9]{4}$/);
  });

  it('elimina caracteres especiales y puntuación', () => {
    const slug = generateSlug('¡Alerta! Peligro en el área #1');
    expect(slug).toMatch(/^alerta-peligro-en-el-area-1-[a-z0-9]{4}$/);
  });

  it('colapsa múltiples espacios y guiones consecutivos en uno solo', () => {
    const slug = generateSlug('La   Chispa   Sur');
    expect(slug).toMatch(/^la-chispa-sur-[a-z0-9]{4}$/);
  });

  it('trunca la base a máximo 60 caracteres antes del sufijo', () => {
    const slug = generateSlug('a'.repeat(80));
    // base (60) + '-' + sufijo (4) = 65 chars máximo
    expect(slug.length).toBeLessThanOrEqual(65);
  });

  it('genera sufijos distintos para el mismo título (unicidad)', () => {
    const slug1 = generateSlug('Noticia Repetida');
    const slug2 = generateSlug('Noticia Repetida');
    expect(slug1).not.toBe(slug2);
  });

  it('createPost guarda automáticamente el slug generado en Firestore', async () => {
    invalidateCache();
    vi.clearAllMocks();
    (setDoc as any).mockResolvedValue(undefined);

    await createPost({
      title: 'Nueva Noticia de Prueba',
      content: '',
      headerImageUrl: '',
      authorId: 'uid-1',
      published: true,
    } as any);

    const savedData = (setDoc as any).mock.calls[0][1];
    expect(savedData.slug).toBeDefined();
    expect(savedData.slug).toMatch(/^nueva-noticia-de-prueba-[a-z0-9]{4}$/);
  });

});

// ── getPostBySlug ─────────────────────────────────────────────────────────────

describe('getPostBySlug', () => {

  const MOCK_TIMESTAMP = { toDate: () => new Date('2026-04-01T12:00:00Z') };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache();
  });

  it('devuelve el post desde caché cuando hay match por slug', async () => {
    const fakeDocsWithSlug = [{
      id: 'post-slug',
      data: () => ({
        slug: 'mi-slug-abc1',
        title: 'Post con Slug',
        content: '',
        createdAt: MOCK_TIMESTAMP,
        updatedAt: MOCK_TIMESTAMP,
      })
    }];
    (getDocs as any).mockResolvedValue({ docs: fakeDocsWithSlug });

    // Poblar caché
    await getPosts(true);
    vi.clearAllMocks(); // resetear contadores después de poblar caché

    const result = await getPostBySlug('mi-slug-abc1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('post-slug');
    // No debería haber llamado a getDocs (vino de caché)
    expect(getDocs).toHaveBeenCalledTimes(0);
  });

  it('hace query a Firestore cuando el slug no está en caché', async () => {
    const fakeSlugDoc = {
      id: 'post-remoto',
      data: () => ({
        slug: 'slug-remoto-xyz9',
        title: 'Remoto',
        content: '',
        createdAt: MOCK_TIMESTAMP,
        updatedAt: MOCK_TIMESTAMP
      })
    };
    (getDocs as any).mockResolvedValue({ docs: [fakeSlugDoc], empty: false });

    const result = await getPostBySlug('slug-remoto-xyz9');

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(result?.slug).toBe('slug-remoto-xyz9');
  });

  it('retorna null si el slug no existe en Firestore', async () => {
    (getDocs as any).mockResolvedValue({ docs: [], empty: true });

    const result = await getPostBySlug('slug-inexistente');

    expect(result).toBeNull();
  });

});

// ── getPost — búsqueda dual (slug → ID fallback) ──────────────────────────────

describe('getPost — búsqueda dual', () => {

  const MOCK_TIMESTAMP = { toDate: () => new Date('2026-04-01T12:00:00Z') };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache();
  });

  it('usa fallback a getDoc (ID de Firestore) cuando el slug no existe — compatibilidad URLs antiguas', async () => {
    // getPostBySlug → no encuentra nada (no es un slug)
    (getDocs as any).mockResolvedValue({ docs: [], empty: true });
    // getDoc → encuentra el documento directamente por ID
    (getDoc as any).mockResolvedValue({
      id: 'firestore-id-antiguo',
      exists: () => true,
      data: () => ({ title: 'Post Antiguo', content: '', createdAt: MOCK_TIMESTAMP, updatedAt: MOCK_TIMESTAMP })
    });

    const result = await getPost('firestore-id-antiguo', true);

    expect(result?.id).toBe('firestore-id-antiguo');
    expect(result?.title).toBe('Post Antiguo');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('retorna null si ni el slug ni el ID existen en Firestore', async () => {
    (getDocs as any).mockResolvedValue({ docs: [], empty: true });
    (getDoc as any).mockResolvedValue({ exists: () => false });

    const result = await getPost('no-existe-en-ningun-lado', true);

    expect(result).toBeNull();
  });

});

// ── deletePost ────────────────────────────────────────────────────────────────

describe('deletePost', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache();
  });

  it('llama a deleteDoc con la referencia del post eliminado', async () => {
    (deleteDoc as any).mockResolvedValue(undefined);

    await deletePost('post-a-borrar');

    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  it('invalida la caché tras borrar', async () => {
    (deleteDoc as any).mockResolvedValue(undefined);

    await deletePost('post-1');

    expect(sessionStorage.removeItem).toHaveBeenCalled();
  });

});

// ── getPostsByAuthor ──────────────────────────────────────────────────────────

describe('getPostsByAuthor', () => {

  const MOCK_TIMESTAMP = { toDate: () => new Date('2026-04-01T12:00:00Z') };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    invalidateCache();
  });

  it('retorna los posts del autor indicado', async () => {
    const authorDocs = [
      { id: 'p1', data: () => ({ title: 'Post A', content: '', authorId: 'autor-x', createdAt: MOCK_TIMESTAMP, updatedAt: MOCK_TIMESTAMP }) },
      { id: 'p2', data: () => ({ title: 'Post B', content: '', authorId: 'autor-x', createdAt: MOCK_TIMESTAMP, updatedAt: MOCK_TIMESTAMP }) },
    ];
    (getDocs as any).mockResolvedValue({ docs: authorDocs });

    const result = await getPostsByAuthor('autor-x');

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('p1');
  });

  it('retorna array vacío si el autor no tiene posts', async () => {
    (getDocs as any).mockResolvedValue({ docs: [] });

    const result = await getPostsByAuthor('autor-sin-posts');

    expect(result).toEqual([]);
  });

});
