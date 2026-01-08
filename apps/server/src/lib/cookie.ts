import type { RefreshToken } from '@server/generated/prisma/client'
import type { Context } from 'hono'
import { getEnv } from '@server/src/lib/env'
import { getContext } from '@server/src/middleware/context.middleware'
import { getCookie, setCookie } from 'hono/cookie'

interface CookieDeps {
  getContext: () => Context
  setCookie: typeof setCookie
  getCookie: typeof getCookie
  now: () => number
}

interface RefreshTokenCookieConfig {
  name: string
  baseOptions: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'Lax' | 'Strict' | 'None'
    domain?: string
    path: string
  }
}

export function createRefreshTokenCookie(
  deps: CookieDeps,
  config: RefreshTokenCookieConfig,
) {
  const getMaxAgeInSeconds = (expiresAt: Date): number =>
    Math.floor((expiresAt.getTime() - deps.now()) / 1000)

  return {
    set(refreshToken: RefreshToken): void {
      deps.setCookie(
        deps.getContext(),
        config.name,
        refreshToken.token,
        {
          ...config.baseOptions,
          maxAge: getMaxAgeInSeconds(refreshToken.expiresAt),
        },
      )
    },

    get(): string | undefined {
      return deps.getCookie(deps.getContext(), config.name)
    },

    clear(): void {
      deps.setCookie(deps.getContext(), config.name, '', {
        ...config.baseOptions,
        maxAge: 0,
      })
    },
  }
}

export const refreshTokenCookie = createRefreshTokenCookie(
  {
    getContext: () => getContext()!,
    setCookie,
    getCookie,
    now: () => Date.now(),
  },
  {
    name: 'refresh_token',
    baseOptions: {
      httpOnly: true,
      secure: getEnv().isProduction,
      sameSite: 'Lax',
      domain: getEnv().domain,
      path: '/',
    },
  },
)
