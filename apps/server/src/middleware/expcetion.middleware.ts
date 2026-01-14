import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { BusinessError } from '@server/src/common/exception'
import { logger } from '@server/src/middleware/trace.middleware'
import { internalError, notFoundError } from '@server/src/schemas/error.schema'

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export function onErrorHandler(error: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  if (isHTTPResponseError(error)) {
    logger().warn(`HTTP Response Error: ${c.req.method} ${c.req.url} - ${error.message}`)
    return error.getResponse()
  }

  if (error instanceof BusinessError) {
    logger().warn(`Business Error: ${c.req.method} ${c.req.url} - ${JSON.stringify(error.error)}`)
    return error.getErrorResponse(c)
  }

  logger().error(error, error.message)
  return internalError(c)
}

export function onNotFoundHandler(c: Context): Response | Promise<Response> {
  logger().warn(`Not Found: ${c.req.method} ${c.req.url}`)
  return notFoundError(c)
}

function isHTTPResponseError(e: unknown): e is HTTPResponseError {
  return (
    !!e
    && typeof e === 'object'
    && 'getResponse' in e
    && typeof (e as any).getResponse === 'function'
  )
}
