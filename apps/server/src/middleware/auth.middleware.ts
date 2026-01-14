import type { AuthPayload } from '@server/src/lib/jwt'
import type { Context, Next } from 'hono'
import { BusinessError } from '@server/src/common/exception'
import { jwtService } from '@server/src/lib/jwt'
import { getContext } from '@server/src/middleware/context.middleware'
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

export function getLoginUser(requireLogin: boolean = true): AuthPayload {
  const authPayload = getContext()?.get(authPayloadKey)
  if (requireLogin && !authPayload) {
    throw BusinessError.Unauthorized('User not logged in')
  }

  return authPayload ?? { userId: '' }
}
