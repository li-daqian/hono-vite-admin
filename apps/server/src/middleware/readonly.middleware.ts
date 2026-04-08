import type { MiddlewareHandler } from 'hono'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'

const SAFE_READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const READ_ONLY_MUTATION_ALLOWLIST = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
])

export function shouldAllowReadOnlyRequest(method: string, path: string): boolean {
  if (SAFE_READ_ONLY_METHODS.has(method.toUpperCase())) {
    return true
  }

  return READ_ONLY_MUTATION_ALLOWLIST.has(path)
}

export function createReadOnlyMiddleware(
  isReadOnlyModeEnabled: () => boolean = () => getEnv().deployment.readOnlyMode,
): MiddlewareHandler {
  return async (c, next) => {
    if (!isReadOnlyModeEnabled() || shouldAllowReadOnlyRequest(c.req.method, c.req.path)) {
      await next()
      return
    }

    throw BusinessError.ReadOnlyModeEnabled()
  }
}

export const readOnlyMiddleware = createReadOnlyMiddleware()
