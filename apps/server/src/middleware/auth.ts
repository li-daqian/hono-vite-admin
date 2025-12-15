import type { UserAuthContext } from '@server/src/lib/jwt'
import type { Context, Next } from 'hono'
import { UnauthorizedError } from '@server/src/common/exception'
import { getAccessToken, getAuthContext } from '@server/src/lib/jwt'
import { getContext } from '@server/src/middleware/context-holder'
import { authLoginRoute, authRefreshRoute } from '@server/src/routes/auth.route'

const authContextKey = 'authContext'
const whiltelistPaths = [authLoginRoute, authRefreshRoute]

export async function authMiddleware(c: Context, next: Next): Promise<void | Response> {
  if (whiltelistPaths.some(route => route.path === c.req.path
    && route.method.toLowerCase() === c.req.method.toLowerCase())) {
    await next()
    return
  }

  const token = getAccessToken(c)

  if (!token) {
    throw new UnauthorizedError()
  }

  const authContext = await getAuthContext(token)

  if (!authContext?.userId) {
    throw new UnauthorizedError()
  }

  try {
    const authContext = await getAuthContext(token)

    if (!authContext?.userId) {
      throw new UnauthorizedError()
    }

    c.set(authContextKey, authContext)
    await next()
  }
  catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error
    }
    throw new UnauthorizedError()
  }
}

export function getLoginUser(): UserAuthContext | undefined {
  return getContext()?.get(authContextKey)
}
