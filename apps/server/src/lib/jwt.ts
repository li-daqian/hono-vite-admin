import { getEnv } from '@server/src/lib/env'
import { logger } from '@server/src/middleware/trace.middleware'
import { errors, jwtVerify, SignJWT } from 'jose'

const jwtSecret = new TextEncoder().encode(getEnv().auth.jwtSecret)

export interface AuthPayload {
  userId: string
}

export async function generateAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(getEnv().auth.accessTokenExpiry)
    .sign(jwtSecret)
}

export async function verifyAccessToken(token: string): Promise<AuthPayload | undefined> {
  try {
    const { payload } = await jwtVerify<AuthPayload>(token, jwtSecret)
    return payload
  }
  catch (error) {
    if (!(error instanceof errors.JWTExpired)) {
      logger().warn(error, `Failed to verify JWT token: ${token}`)
    }
    return undefined
  }
}
