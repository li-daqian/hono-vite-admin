import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import { BusinessErrorEnum } from '@server/src/common/constant'
import { BusinessError } from '@server/src/common/exception'
import { errorResponse } from '@server/src/common/response'
import { log } from '@server/src/middleware/trace-logger'

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export function onErrorHandler(err: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  if (isHTTPResponseError(err)) {
    log()?.error(err, 'HTTPResponseError occurred')
    return err.getResponse()
  }

  log()?.error(err, 'Unhandled exception occurred')
  if (err instanceof BusinessError) {
    return c.json(errorResponse(err))
  }
  else {
    return c.json(errorResponse(BusinessErrorEnum.INTERNAL_SERVER_ERROR), 500)
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
