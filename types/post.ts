// types/post.ts — Tipo compartido entre server y client
export interface Post {
  id: string
  slug?: string | null
  title: string
  content: string
  headerImageUrl: string
  authorId: string
  authorName?: string | null
  createdAt: string   // ISO string
  updatedAt: string   // ISO string
  published?: boolean
  kudosCount?: number
  category?: string
  isFeatured?: boolean
}
