// utils/categories.ts
// Fuente única de verdad de las categorías (secciones) del sitio.
// Se utiliza tanto en el cliente (navbar, portada, mantenedor de noticias)
// como en el servidor (sitemap, RSS).

/** Categoría asignada cuando un artículo no define una o define una vacía. */
export const DEFAULT_CATEGORY = 'Actualidad'

/**
 * Categorías oficiales del sitio, en el orden en que se muestran
 * en el menú de secciones y en la portada.
 */
export const NEWS_CATEGORIES = [
  'Actualidad',
  'Nacional',
  'Internacional',
  'Regional',
  'Política',
  'Cultura',
  'Opinión',
] as const

/** Nombre de una categoría oficial del sitio. */
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

/** Indica si un valor corresponde a una categoría oficial del sitio. */
export const isNewsCategory = (value: unknown): value is NewsCategory =>
  typeof value === 'string' && (NEWS_CATEGORIES as readonly string[]).includes(value)

/**
 * Ordena una lista de categorías según el orden oficial.
 * Las categorías no reconocidas se agregan al final, ordenadas alfabéticamente.
 */
export const sortCategories = (categories: Iterable<string>): string[] => {
  const unique = [...new Set(categories)].filter(Boolean)
  const known = NEWS_CATEGORIES.filter((cat) => unique.includes(cat))
  const unknown = unique
    .filter((cat) => !isNewsCategory(cat))
    .sort((a, b) => a.localeCompare(b, 'es'))

  return [...known, ...unknown]
}

/**
 * Une las categorías oficiales con las efectivamente usadas en los artículos.
 * Útil para el sitemap: así las secciones nuevas (por ejemplo, Internacional)
 * aparecen aunque todavía no tengan artículos publicados.
 */
export const mergeWithNewsCategories = (categories: Iterable<string>): string[] =>
  sortCategories([...NEWS_CATEGORIES, ...categories])
