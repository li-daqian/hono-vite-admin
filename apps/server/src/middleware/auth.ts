import type { UserAuthContext } from '@server/src/lib/jwt'
import type { Context, Next } from 'hono'
import { UnauthorizedError } from '@server/src/common/exception'
import { getAuthContext } from '@server/src/lib/jwt'
import { getContext } from '@server/src/middleware/context-holder'

const authContextKey = 'authContext'

export async function authMiddleware(c: Context, next: Next): Promise<void | Response> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new UnauthorizedError()
  }

  const authContext = await getAuthContext(token)
  if (!authContext?.userId) {
    throw new UnauthorizedError()
  }

  c.set(authContextKey, authContext)
  await next()
}

export function getLoginUser(): UserAuthContext | undefined {
  return getContext()?.get(authContextKey)
}
