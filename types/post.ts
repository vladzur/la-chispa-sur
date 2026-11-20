// types/post.ts — Tipo compartido entre server y client
export interface Post {
  id: string
  slug?: string | null
  title: string
  content: string
  headerImageUrl: string
  headerImageAlt?: string | null
  authorId: string
  authorName?: string | null
  createdAt: string   // ISO string
  updatedAt: string   // ISO string
  published?: boolean
  publishDate: string  // ISO string — siempre poblado. Iguala createdAt para posts legacy.
  kudosCount?: number
  category?: string
  isFeatured?: boolean
}

/** Página de artículos devuelta por GET /api/posts (paginada por cursor). */
export interface PostPage {
  items: Post[]
  nextCursor: string | null
}
