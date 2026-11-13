// server/utils/slugify.ts — Genera slugs SEO-friendly a partir de un título
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')                          // descompone acentos
    .replace(/[\u0300-\u036f]/g, '')           // elimina diacríticos (á→a, ñ→n, etc.)
    .replace(/[^a-z0-9\s-]/g, '')             // elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-')                      // espacios → guiones
    .replace(/-+/g, '-')                       // guiones múltiples → uno solo
    .substring(0, 80)                          // máximo 80 chars

/**
 * Genera un slug único dentro de la colección indicada.
 * Si el slug base ya existe, agrega sufijos numéricos (-1, -2, ...).
 */
export const generateUniqueSlug = async (
  db: FirebaseFirestore.Firestore,
  collection: string,
  title: string,
): Promise<string> => {
  const base = slugify(title)
  let candidate = base
  let i = 1
  while (true) {
    const existing = await db.collection(collection).where('slug', '==', candidate).limit(1).get()
    if (existing.empty) return candidate
    candidate = `${base}-${i++}`
  }
}
