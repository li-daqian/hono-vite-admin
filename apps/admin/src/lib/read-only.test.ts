import { describe, expect, it } from 'vitest'
import { READ_ONLY_MODE_MESSAGE } from './read-only'

describe('read-only config', () => {
  it('provides the default demo mode message', () => {
    expect(READ_ONLY_MODE_MESSAGE).toBe('Demo read-only')
  })
})
