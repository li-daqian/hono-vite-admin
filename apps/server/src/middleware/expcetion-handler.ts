import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { HttpStatusError } from '@server/src/common/exception'
import { errorResponse, internalServerErrorResponse } from '@server/src/common/response'
import { logger } from '@server/src/middleware/trace-logger'

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export function onErrorHandler(error: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  logger().error(error, error.message)

  if (isHTTPResponseError(error)) {
    return error.getResponse()
  }

  if (error instanceof HttpStatusError) {
    return errorResponse(c, error)
  }
  else {
    return internalServerErrorResponse(c)
  }
}

function isHTTPResponseError(e: unknown): e is HTTPResponseError {
  return (
    !!e
    && typeof e === 'object'
    && 'getResponse' in e
    && typeof (e as any).getResponse === 'function'
  )
}
