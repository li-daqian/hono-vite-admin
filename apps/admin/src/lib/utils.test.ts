import { describe, expect, it } from 'vitest'
import { getPageNumbers } from './utils'

describe('getPageNumbers', () => {
  it('should return all pages when total pages <= 5', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3])
    expect(getPageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('should show pages near beginning with ellipsis', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, '...', 10])
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 4, '...', 10])
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, '...', 10])
  })

  it('should show pages in middle with ellipsis on both sides', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
    expect(getPageNumbers(6, 10)).toEqual([1, '...', 5, 6, 7, '...', 10])
    expect(getPageNumbers(7, 12)).toEqual([1, '...', 6, 7, 8, '...', 12])
  })

  it('should show pages near end with ellipsis', () => {
    expect(getPageNumbers(8, 10)).toEqual([1, '...', 7, 8, 9, 10])
    expect(getPageNumbers(9, 10)).toEqual([1, '...', 7, 8, 9, 10])
    expect(getPageNumbers(10, 10)).toEqual([1, '...', 7, 8, 9, 10])
  })

  it('should handle edge cases with small total pages', () => {
    expect(getPageNumbers(1, 6)).toEqual([1, 2, 3, 4, '...', 6])
    expect(getPageNumbers(3, 6)).toEqual([1, 2, 3, 4, '...', 6])
    expect(getPageNumbers(6, 6)).toEqual([1, '...', 3, 4, 5, 6])
  })

  it('should handle large page numbers', () => {
    expect(getPageNumbers(50, 100)).toEqual([1, '...', 49, 50, 51, '...', 100])
    expect(getPageNumbers(1, 100)).toEqual([1, 2, 3, 4, '...', 100])
    expect(getPageNumbers(100, 100)).toEqual([1, '...', 97, 98, 99, 100])
  })
})
