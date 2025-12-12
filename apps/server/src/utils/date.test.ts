import { describe, expect, it } from 'bun:test'
import { parseTimeDuration } from './date'

describe('parseTimeDuration', () => {
  it('should parse seconds correctly', () => {
    const result = parseTimeDuration('30s')
    const expected = new Date()
    expected.setSeconds(expected.getSeconds() + 30)

    // Allow 1 second tolerance for test execution time
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse minutes correctly', () => {
    const result = parseTimeDuration('15m')
    const expected = new Date()
    expected.setMinutes(expected.getMinutes() + 15)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse hours correctly', () => {
    const result = parseTimeDuration('2h')
    const expected = new Date()
    expected.setHours(expected.getHours() + 2)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse days correctly', () => {
    const result = parseTimeDuration('7d')
    const expected = new Date()
    expected.setDate(expected.getDate() + 7)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse weeks correctly', () => {
    const result = parseTimeDuration('2w')
    const expected = new Date()
    expected.setDate(expected.getDate() + 14)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse months correctly', () => {
    const result = parseTimeDuration('3M')
    const expected = new Date()
    expected.setMonth(expected.getMonth() + 3)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should parse years correctly', () => {
    const result = parseTimeDuration('1y')
    const expected = new Date()
    expected.setFullYear(expected.getFullYear() + 1)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should throw error for invalid format', () => {
    expect(() => parseTimeDuration('invalid')).toThrow('Invalid duration format')
  })

  it('should throw error for missing unit', () => {
    expect(() => parseTimeDuration('10')).toThrow('Invalid duration format')
  })

  it('should throw error for missing value', () => {
    expect(() => parseTimeDuration('h')).toThrow('Invalid duration format')
  })

  it('should throw error for unknown unit', () => {
    expect(() => parseTimeDuration('10x')).toThrow('Invalid duration format')
  })

  it('should handle large values', () => {
    const result = parseTimeDuration('100d')
    const expected = new Date()
    expected.setDate(expected.getDate() + 100)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('should handle single digit values', () => {
    const result = parseTimeDuration('1s')
    const expected = new Date()
    expected.setSeconds(expected.getSeconds() + 1)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })
})
