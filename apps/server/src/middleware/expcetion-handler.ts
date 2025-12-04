import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { errorResponse } from '@server/src/common/response'
import { logger } from '@server/src/middleware/trace-logger'

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export function onErrorHandler(err: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  logger().error(err, err.message)

  if (isHTTPResponseError(err)) {
    return err.getResponse()
  }

  const response = errorResponse(err)
  return c.json(response, response.code)
}

function isHTTPResponseError(e: unknown): e is HTTPResponseError {
  return (
    !!e
    && typeof e === 'object'
    && 'getResponse' in e
    && typeof (e as any).getResponse === 'function'
  )
}
