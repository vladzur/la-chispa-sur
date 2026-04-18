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
