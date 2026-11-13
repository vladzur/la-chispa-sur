// utils/letters.spec.ts
// Pruebas unitarias de los helpers de la sección Cartas al Director.
import { describe, expect, it } from 'vitest'
import { formatLetterSignature, getLetterExcerpt } from './letters'

describe('formatLetterSignature', () => {
  it('should join name and city with a comma', () => {
    expect(formatLetterSignature('María González', 'Valdivia')).toBe('María González, Valdivia')
  })

  it('should return only the name when city is missing', () => {
    // La ciudad es opcional en la firma pública
    expect(formatLetterSignature('María González', '')).toBe('María González')
    expect(formatLetterSignature('María González', null)).toBe('María González')
    expect(formatLetterSignature('María González', undefined)).toBe('María González')
  })

  it('should trim whitespace from name and city', () => {
    expect(formatLetterSignature('  María González  ', '  Valdivia ')).toBe('María González, Valdivia')
  })

  it('should return an empty string when both are empty', () => {
    expect(formatLetterSignature('', '')).toBe('')
    expect(formatLetterSignature('   ', '   ')).toBe('')
  })
})

describe('getLetterExcerpt', () => {
  it('should strip HTML tags from the content', () => {
    expect(getLetterExcerpt('<p>Estimado <strong>director</strong>:</p>')).toBe('Estimado director:')
  })

  it('should replace &nbsp; entities with spaces', () => {
    expect(getLetterExcerpt('<p>Estimado&nbsp;director</p>')).toBe('Estimado director')
  })

  it('should truncate content longer than maxLength', () => {
    const longText = 'a'.repeat(300)

    expect(getLetterExcerpt(longText)).toHaveLength(200)
    expect(getLetterExcerpt(longText, 50)).toHaveLength(50)
  })

  it('should return the full text when shorter than maxLength', () => {
    expect(getLetterExcerpt('<p>Carta breve</p>')).toBe('Carta breve')
  })

  it('should handle empty or nullish content', () => {
    expect(getLetterExcerpt('')).toBe('')
    expect(getLetterExcerpt(null as unknown as string)).toBe('')
    expect(getLetterExcerpt(undefined as unknown as string)).toBe('')
  })
})
