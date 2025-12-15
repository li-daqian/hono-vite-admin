import type { Context } from 'hono'
import { envConfig } from '@server/src/common/config'
import { logger } from '@server/src/middleware/trace-logger'
import { getCookie, setCookie } from 'hono/cookie'
import { jwtVerify, SignJWT } from 'jose'

const jwtSecret = new TextEncoder().encode(envConfig.auth.jwtSecret)

export interface UserAuthContext {
  userId: string
}

export async function generateAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(envConfig.auth.accessTokenExpiry)
    .sign(jwtSecret)
}

export async function getAuthContext(token: string): Promise<UserAuthContext | undefined> {
  try {
    const { payload } = await jwtVerify<UserAuthContext>(token, jwtSecret)
    return payload
  }
  catch (error) {
    logger().warn(error, `Failed to verify JWT token: ${token}`)
    return undefined
  }
}

const accessTokenCookieName = 'access_token'
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: envConfig.isProduction,
  sameSite: 'Lax' as const,
  domain: envConfig.domain,
  path: '/',
}

export function storeAcessToken(c: Context, accessToken: string): void {
  setCookie(c, accessTokenCookieName, accessToken, accessTokenCookieOptions)
}

export function getAccessToken(c: Context): string | undefined {
  const token = getCookie(c, accessTokenCookieName)
  return token
}

export function clearAccessToken(c: Context): void {
  setCookie(c, accessTokenCookieName, '', {
    ...accessTokenCookieOptions,
    maxAge: 0,
  })
}
