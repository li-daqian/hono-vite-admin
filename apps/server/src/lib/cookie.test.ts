import { createRefreshTokenCookie } from '@server/src/lib/cookie'
import { describe, expect, it, vi } from 'bun:test'

describe('createRefreshTokenCookie', () => {
  it('sets refresh token with correct maxAge', () => {
    const setCookie = vi.fn()
    const getCookie = vi.fn()
    const getContext = vi.fn()

    const now = new Date('2026-01-01T00:00:00Z').getTime()
    const expiresAt = new Date('2026-01-01T01:00:00Z')

    const cookie = createRefreshTokenCookie(
      {
        getContext,
        setCookie,
        getCookie,
        now: () => now,
      },
      {
        name: 'refresh_token',
        baseOptions: {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          path: '/',
        },
      },
    )

    cookie.set({ id: 'id', userId: 'userId', token: 'abc123', expiresAt, createdAt: new Date() })

    expect(setCookie).toHaveBeenCalledWith(
      undefined,
      'refresh_token',
      'abc123',
      expect.objectContaining({
        maxAge: 3600,
      }),
    )
  })
})
