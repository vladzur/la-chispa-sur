// utils/letters.ts — Helpers puros para la sección Cartas al Director.
// Se auto-importan en el cliente; en código server importar explícitamente
// desde '~/utils/letters'.

/**
 * Formatea la firma pública de una carta: "María González, Valdivia".
 * Si no hay ciudad, retorna solo el nombre.
 */
export const formatLetterSignature = (senderName: string, senderCity?: string | null): string => {
  const name = (senderName ?? '').trim()
  const city = (senderCity ?? '').trim()
  return city ? `${name}, ${city}` : name
}

/**
 * Extrae el texto plano del contenido HTML y lo trunca.
 * Se usa para los extractos de las cards y la meta description.
 */
export const getLetterExcerpt = (content: string, maxLength = 200): string => {
  const text = (content ?? '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return text.length <= maxLength ? text : text.substring(0, maxLength)
}
