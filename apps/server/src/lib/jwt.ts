import type { RefreshToken } from '@server/generated/prisma/client'
import { getEnv } from '@server/src/lib/env'
import { getContext } from '@server/src/middleware/context-holder'
import { logger } from '@server/src/middleware/trace-logger'
import { getCookie, setCookie } from 'hono/cookie'
import { errors, jwtVerify, SignJWT } from 'jose'

const jwtSecret = new TextEncoder().encode(getEnv().auth.jwtSecret)

export interface UserAuthContext {
  userId: string
}

export async function generateAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(getEnv().auth.accessTokenExpiry)
    .sign(jwtSecret)
}

export async function getAuthContext(token: string): Promise<UserAuthContext | undefined> {
  try {
    const { payload } = await jwtVerify<UserAuthContext>(token, jwtSecret)
    return payload
  }
  catch (error) {
    if (!(error instanceof errors.JWTExpired)) {
      logger().warn(error, `Failed to verify JWT token: ${token}`)
    }
    return undefined
  }
}

const refreshTokenCookieName = 'refresh_token'
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: getEnv().isProduction,
  sameSite: 'Lax' as const,
  domain: getEnv().domain,
  path: '/',
}
export const refreshTokenCookie = {
  set(refreshToken: RefreshToken): void {
    setCookie(getContext()!, refreshTokenCookieName, refreshToken.token, {
      ...refreshTokenCookieOptions,
      maxAge: Math.floor(
        (refreshToken.expiresAt.getTime() - Date.now()) / 1000,
      ),
    })
  },

  get(): string | undefined {
    return getCookie(getContext()!, refreshTokenCookieName)
  },

  clear(): void {
    setCookie(getContext()!, refreshTokenCookieName, '', {
      ...refreshTokenCookieOptions,
      maxAge: 0,
    })
  },
}
