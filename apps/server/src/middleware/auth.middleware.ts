import type { AuthPayload } from '@server/src/lib/jwt'
import type { Context, Next } from 'hono'
import { jwtService } from '@server/src/lib/jwt'
import { getRequestId } from '@server/src/middleware/requestId.middleware'

const authPayloadKey = 'authPayload'

export async function authMiddleware(c: Context, next: Next): Promise<void | Response> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: { type: 'Unauthorized', requestId: getRequestId(c) } }, 401)
  }

  const authPayload = await jwtService.verifyAccessToken(token)
  if (!authPayload?.userId) {
    return c.json({ error: { type: 'Unauthorized', requestId: getRequestId(c) } }, 401)
  }

  c.set(authPayloadKey, authPayload)
  await next()
}

export function getLoginUser(c: Context): AuthPayload {
  return c.get(authPayloadKey)!
}
