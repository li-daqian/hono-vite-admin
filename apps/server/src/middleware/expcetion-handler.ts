import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { errorResponse } from '../dto/response.dto'
import { getCurrentLogger } from './trace-logger'

/**
 * 基类异常，包含状态码和异常消息
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
 * 400 Bad Request 异常
 */
export class BadRequestException extends HttpStatusException {
  constructor(message: string = 'Bad Request') {
    super(400, message)
  }
}

/**
 * 401 Unauthorized 异常
 */
export class UnauthorizedException extends HttpStatusException {
  constructor(message: string = 'Unauthorized') {
    super(401, message)
  }
}

/**
 * 500 Internal Server Error 异常
 */
export class InternalServerErrorException extends HttpStatusException {
  constructor(message: string = 'Internal Server Error') {
    super(500, message)
  }
}

/**
 * Hono `app.onError` style handler function.
 * 可以直接传给 `app.onError(onErrorHandler)` 或者在其他地方复用。
 */
export function onErrorHandler(err: Error | HTTPResponseError, c: Context): Response | Promise<Response> {
  if (isHTTPResponseError(err)) {
    getCurrentLogger()?.error(err, 'HTTPResponseError occurred')
    return err.getResponse()
  }

  getCurrentLogger()?.error(err, 'Unhandled error')
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
