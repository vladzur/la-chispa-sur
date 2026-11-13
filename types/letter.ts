// types/letter.ts — Tipo compartido entre server y client
export interface Letter {
  id: string
  slug?: string | null
  title: string
  content: string          // HTML generado por Tiptap
  senderName: string       // Nombre del remitente — firma pública de la carta
  senderCity: string       // Ciudad/localidad del remitente — firma pública
  authorId: string         // Editor que ingresó la carta al sistema
  authorName?: string | null
  createdAt: string   // ISO string
  updatedAt: string   // ISO string
  published?: boolean
  publishDate: string  // ISO string — siempre poblado. Soporta publicación programada.
}
