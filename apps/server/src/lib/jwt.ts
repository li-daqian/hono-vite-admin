import { getEnv } from '@server/src/lib/env'
import { logger } from '@server/src/middleware/trace.middleware'
import { errors, jwtVerify, SignJWT } from 'jose'

export interface AuthPayload {
  userId: string
}

export interface JwtConfig {
  secret: Uint8Array
  accessTokenExpiry: string | number
}

export function createJwtService(config: JwtConfig) {
  async function generateAccessToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(config.accessTokenExpiry)
      .sign(config.secret)
  }

  async function verifyAccessToken(token: string): Promise<AuthPayload | undefined> {
    try {
      const { payload } = await jwtVerify<AuthPayload>(token, config.secret)
      return payload
    }
    catch (error) {
      if (!(error instanceof errors.JWTExpired)) {
        logger()?.warn(error, `Failed to verify JWT token`)
      }
      return undefined
    }
  }

  return {
    generateAccessToken,
    verifyAccessToken,
  }
}

export const jwtService = createJwtService(
  {
    secret: new TextEncoder().encode(getEnv().auth.jwtSecret),
    accessTokenExpiry: getEnv().auth.accessTokenExpiry,
  },
)
