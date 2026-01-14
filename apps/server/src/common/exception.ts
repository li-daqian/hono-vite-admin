import type { ErrorResponse } from '@server/src/schemas/error.schema'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { getRequestId } from '@server/src/middleware/requestId.middleware'

export class BusinessError extends Error {
  private _httpStatus: ContentfulStatusCode
  private _errorBody: ErrorResponse

  constructor(type: string, errorCode: string, message: string, httpStatus: ContentfulStatusCode) {
    super(message)
    this._errorBody = { error: { type, code: errorCode, message, requestId: getRequestId() } }
    this._httpStatus = httpStatus
    this.name = 'HttpStatusError'
  }

  public get error(): ErrorResponse {
    return this._errorBody
  }

  public getErrorResponse(c: Context): Response {
    return c.json(this._errorBody, this._httpStatus)
  }

  public static Unauthorized(message: string, code: string = '') {
    return new BusinessError('Unauthorized', code, message, 401)
  }

  public static Forbidden(message: string, code: string = '') {
    return new BusinessError('Forbidden', code, message, 403)
  }

  public static BadRequest(message: string, code: string = '') {
    return new BusinessError('Bad Request', code, message, 400)
  }

  public static NotFound(message: string, code: string = '') {
    return new BusinessError('Not Found', code, message, 404)
  }

  public static UserOrPasswordIncorrect() {
    return this.BadRequest('User or password is incorrect', 'UserOrPasswordIncorrect')
  }

  public static UsernameAlreadyExists() {
    return this.BadRequest('Username already exists', 'UsernameAlreadyExists')
  }
}
