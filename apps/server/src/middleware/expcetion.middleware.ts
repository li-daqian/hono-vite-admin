import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { BusinessError } from '@server/src/common/exception'
import { getRequestId } from '@server/src/middleware/requestId.middleware'
import { logger } from '@server/src/middleware/trace.middleware'

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
    logger().info(`Business Error: ${c.req.method} ${c.req.url} - ${JSON.stringify(error.error)}`)
    return error.getErrorResponse(c)
  }

  logger().error(error, error.message)
  return c.json({ message: 'An internal server error occurred', requestId: getRequestId() }, 500)
}

export function onNotFoundHandler(c: Context): Response | Promise<Response> {
  logger().warn(`Not Found: ${c.req.method} ${c.req.url}`)
  return c.json({ message: 'The requested resource was not found' }, 404)
}

function isHTTPResponseError(e: unknown): e is HTTPResponseError {
  return (
    !!e
    && typeof e === 'object'
    && 'getResponse' in e
    && typeof (e as any).getResponse === 'function'
  )
}
