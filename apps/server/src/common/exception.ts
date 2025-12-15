import type { ContentfulStatusCode } from 'hono/utils/http-status'

export abstract class HttpStatusError extends Error {
  private _httpStatus: ContentfulStatusCode
  private _code: string

  constructor(errorCode: string, message: string, httpStatus: ContentfulStatusCode) {
    super(message)
    this._httpStatus = httpStatus
    this._code = errorCode
    this.name = 'HttpStatusError'
  }

  public get httpStatus(): ContentfulStatusCode {
    return this._httpStatus
  }

  public get code(): string {
    return this._code
  }
}

export class UnauthorizedError extends HttpStatusError {
  constructor(errorCode: string = 'UNAUTHORIZED', message: string = 'Unauthorized') {
    super(errorCode, message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends HttpStatusError {
  constructor(errorCode: string = 'FORBIDDEN', message: string = 'Forbidden') {
    super(errorCode, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class BadRequestError extends HttpStatusError {
  constructor(errorCode: string = 'BAD_REQUEST', message: string = 'Bad Request') {
    super(errorCode, message, 400)
    this.name = 'BadRequestError'
  }

  static Message(message: string) {
    return new BadRequestError('BAD_REQUEST', message)
  }

  static UserOrPasswordIncorrect() {
    return new BadRequestError('USER_OR_PASSWORD_INCORRECT', 'User or password is incorrect')
  }

  static UsernameAlreadyExists() {
    return new BadRequestError('USERNAME_ALREADY_EXISTS', 'Username already exists')
  }
}
