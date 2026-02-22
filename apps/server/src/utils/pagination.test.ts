import { describe, expect, it } from 'bun:test'
import { buildOrderBy, paginate } from './pagination'

describe('buildOrderBy', () => {
  const allowedFields = ['createdAt', 'username', 'email'] as const
  const defaultOrder = { createdAt: 'desc' } as const

  it('returns default order when sort is null', () => {
    const result = buildOrderBy(null, allowedFields, defaultOrder)

    expect(result).toEqual(defaultOrder)
  })

  it('returns default order when sort is empty string', () => {
    const result = buildOrderBy('', allowedFields, defaultOrder)

    expect(result).toEqual(defaultOrder)
  })

  it('builds single field order by', () => {
    const result = buildOrderBy('username asc', allowedFields, defaultOrder)

    expect(result).toEqual({ username: 'asc' })
  })

  it('builds multi-field order by', () => {
    const result = buildOrderBy('createdAt desc, username asc', allowedFields, defaultOrder)

    expect(result).toEqual([
      { createdAt: 'desc' },
      { username: 'asc' },
    ])
  })

  it('normalizes uppercase sort direction', () => {
    const result = buildOrderBy('email DESC', allowedFields, defaultOrder)

    expect(result).toEqual({ email: 'desc' })
  })

  it('throws for invalid sort format', () => {
    expect(() => buildOrderBy('username', allowedFields, defaultOrder))
      .toThrow()
  })

  it('throws for invalid sort direction', () => {
    expect(() => buildOrderBy('username upward', allowedFields, defaultOrder))
      .toThrow()
  })

  it('throws for invalid sort field', () => {
    expect(() => buildOrderBy('password asc', allowedFields, defaultOrder))
      .toThrow()
  })
})

describe('paginate', () => {
  it('returns paginated response metadata for middle page', () => {
    const result = paginate(['a', 'b'], 10, {
      page: 2,
      pageSize: 2,
      sort: 'createdAt desc',
    })

    expect(result).toEqual({
      items: ['a', 'b'],
      meta: {
        totalItem: 10,
        totalPage: 5,
        page: 2,
        pageSize: 2,
        nextPage: 3,
        previousPage: 1,
        hasNext: true,
        hasPrevious: true,
        sort: 'createdAt desc',
      },
    })
  })

  it('returns correct metadata on first and last page boundaries', () => {
    const first = paginate(['a'], 1, {
      page: 1,
      pageSize: 1,
      sort: null,
    })

    expect(first.meta).toEqual({
      totalItem: 1,
      totalPage: 1,
      page: 1,
      pageSize: 1,
      nextPage: null,
      previousPage: null,
      hasNext: false,
      hasPrevious: false,
      sort: null,
    })
  })
})
