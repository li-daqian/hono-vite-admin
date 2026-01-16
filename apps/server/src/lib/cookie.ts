import type { AuthLoginResponse } from '@server/src/schemas/auth.schema'
import type { Context } from 'hono'
import { getEnv } from '@server/src/lib/env'
import { getCookie, setCookie } from 'hono/cookie'

interface CookieDeps {
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
    set(c: Context, authLoginResponse: AuthLoginResponse): void {
      deps.setCookie(
        c,
        config.name,
        authLoginResponse.refreshToken,
        {
          ...config.baseOptions,
          maxAge: getMaxAgeInSeconds(new Date(authLoginResponse.refreshTokenExpiresAt)),
        },
      )
    },

    get(c: Context): string | undefined {
      return deps.getCookie(c, config.name)
    },

    clear(c: Context): void {
      deps.setCookie(c, config.name, '', {
        ...config.baseOptions,
        maxAge: 0,
      })
    },
  }
}

export const refreshTokenCookie = createRefreshTokenCookie(
  {
    setCookie,
    getCookie,
    now: () => Date.now(),
  },
  {
    name: 'refresh_token',
    baseOptions: {
      path: '/',
      httpOnly: true,
      ...(getEnv().isProduction
        ? {
            sameSite: 'None',
            secure: true,
          }
        : {
            sameSite: 'Strict',
            secure: false,
            domain: 'localhost',
          }),
    },
  },
)
