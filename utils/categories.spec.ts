// utils/categories.spec.ts
// Pruebas unitarias de la fuente única de categorías del sitio.
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATEGORY,
  NEWS_CATEGORIES,
  isNewsCategory,
  mergeWithNewsCategories,
  sortCategories,
} from './categories'

describe('NEWS_CATEGORIES', () => {
  it('should include the Internacional section', () => {
    expect(NEWS_CATEGORIES).toContain('Internacional')
  })

  it('should include the default category', () => {
    expect(NEWS_CATEGORIES).toContain(DEFAULT_CATEGORY)
  })

  it('should not contain duplicated categories', () => {
    expect(new Set(NEWS_CATEGORIES).size).toBe(NEWS_CATEGORIES.length)
  })

  it('should keep the expected section order', () => {
    // Internacional se ubica justo después de Nacional
    expect(NEWS_CATEGORIES.indexOf('Internacional')).toBe(NEWS_CATEGORIES.indexOf('Nacional') + 1)
  })
})

describe('isNewsCategory', () => {
  it('should return true for every official category', () => {
    NEWS_CATEGORIES.forEach((category) => {
      expect(isNewsCategory(category)).toBe(true)
    })
  })

  it('should return true for Internacional', () => {
    expect(isNewsCategory('Internacional')).toBe(true)
  })

  it('should return false for unknown or invalid values', () => {
    expect(isNewsCategory('Deportes')).toBe(false)
    expect(isNewsCategory('')).toBe(false)
    expect(isNewsCategory(null)).toBe(false)
    expect(isNewsCategory(undefined)).toBe(false)
    expect(isNewsCategory(42)).toBe(false)
  })
})

describe('sortCategories', () => {
  it('should sort categories using the official order', () => {
    expect(sortCategories(['Opinión', 'Internacional', 'Actualidad'])).toEqual([
      'Actualidad',
      'Internacional',
      'Opinión',
    ])
  })

  it('should remove duplicates', () => {
    expect(sortCategories(['Nacional', 'Nacional', 'Cultura'])).toEqual(['Nacional', 'Cultura'])
  })

  it('should append unknown categories at the end sorted alphabetically', () => {
    expect(sortCategories(['Deportes', 'Nacional', 'Tendencias'])).toEqual([
      'Nacional',
      'Deportes',
      'Tendencias',
    ])
  })

  it('should ignore empty values', () => {
    expect(sortCategories(['', 'Cultura'])).toEqual(['Cultura'])
  })
})

describe('mergeWithNewsCategories', () => {
  it('should include the official categories even without posts', () => {
    const result = mergeWithNewsCategories([])

    expect(result).toContain('Internacional')
    expect(result).toEqual([...NEWS_CATEGORIES])
  })

  it('should keep official order and append custom categories from posts', () => {
    const result = mergeWithNewsCategories(['Internacional', 'Deportes'])

    expect(result).toEqual([...NEWS_CATEGORIES, 'Deportes'])
  })

  it('should not duplicate a category that exists in posts and in the official list', () => {
    const result = mergeWithNewsCategories(['Nacional', 'Nacional'])

    expect(result.filter((cat) => cat === 'Nacional')).toHaveLength(1)
  })
})
