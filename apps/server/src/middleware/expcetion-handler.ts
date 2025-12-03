import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { errorResponse } from '@server/src/dto/response.dto'
import { log } from '@server/src/middleware/trace-logger'

/**
 * Base exception class that includes a status code and a message
 */
export class HttpStatusException extends Error {
  public statusCode: ContentfulStatusCode

  constructor(statusCode: ContentfulStatusCode, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
  }
}

/**
 * 400 Bad Request exception
 */
export class BadRequestException extends HttpStatusException {
  constructor(message: string = 'Bad Request') {
    super(400, message)
  }
}

/**
 * 401 Unauthorized exception
 */
export class UnauthorizedException extends HttpStatusException {
  constructor(message: string = 'Unauthorized') {
    super(401, message)
  }
}

/**
 * 500 Internal Server Error exception
 */
export class InternalServerErrorException extends HttpStatusException {
  constructor(message: string = 'Internal Server Error') {
    super(500, message)
  }
}

/**
 * Hono `app.onError`-style handler function.
 * Can be passed directly to `app.onError(onErrorHandler)` or reused elsewhere.
 */
export function onErrorHandler(err: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  if (isHTTPResponseError(err)) {
    log()?.error(err, 'HTTPResponseError occurred')
    return err.getResponse()
  }

  log()?.error(err, 'Unhandled error')
  if (err instanceof HttpStatusException) {
    return c.json(errorResponse(err.message), err.statusCode)
  }
  else {
    return c.json(errorResponse('Internal Server Error'), 500)
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
