import type { AuthPayload } from '@server/src/lib/jwt'
import type { Context, Next } from 'hono'
import { UnauthorizedError } from '@server/src/common/exception'
import { jwtService } from '@server/src/lib/jwt'
import { getContext } from '@server/src/middleware/context.middleware'

const authPayloadKey = 'authPayload'

export async function authMiddleware(c: Context, next: Next): Promise<void | Response> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new UnauthorizedError()
  }

  const authPayload = await jwtService.verifyAccessToken(token)
  if (!authPayload?.userId) {
    throw new UnauthorizedError()
  }

  c.set(authPayloadKey, authPayload)
  await next()
}

export function getLoginUser(requireLogin: boolean = true): AuthPayload {
  const authPayload = getContext()?.get(authPayloadKey)
  if (requireLogin && !authPayload) {
    throw new UnauthorizedError()
  }

  return authPayload ?? { userId: '' }
}
