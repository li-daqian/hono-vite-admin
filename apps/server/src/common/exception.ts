import type { ErrorResponse } from '@server/src/schemas/error.schema'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { getRequestId } from '@server/src/middleware/requestId.middleware'

export class BusinessError extends Error {
  private _httpStatus: ContentfulStatusCode
  private _errorBody: ErrorResponse

  constructor(errorCode: string | undefined, message: string, httpStatus: ContentfulStatusCode) {
    super(message)
    this._errorBody = { code: errorCode, message, requestId: getRequestId() }
    this._httpStatus = httpStatus
    this.name = 'HttpStatusError'
  }

  public get error(): ErrorResponse {
    return this._errorBody
  }

  public getErrorResponse(c: Context): Response {
    return c.json(this._errorBody, this._httpStatus)
  }

  public static Unauthorized(message: string) {
    return new BusinessError(undefined, message, 401)
  }

  public static Forbidden(message: string, code: string) {
    return new BusinessError(code, message, 403)
  }

  public static BadRequest(message: string, code: string = '') {
    return new BusinessError(code, message, 400)
  }

  public static NotFound(message: string) {
    return new BusinessError(undefined, message, 404)
  }

  public static UserOrPasswordIncorrect() {
    return this.BadRequest('User or password is incorrect', 'UserOrPasswordIncorrect')
  }

  public static UsernameAlreadyExists() {
    return this.BadRequest('Username already exists', 'UsernameAlreadyExists')
  }
}
