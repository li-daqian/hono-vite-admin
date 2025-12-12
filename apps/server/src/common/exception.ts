import type { ContentfulStatusCode } from 'hono/utils/http-status'

export abstract class HttpStatusError extends Error {
  private httpStatus: ContentfulStatusCode

  constructor(message: string, httpStatus: ContentfulStatusCode) {
    super(message)
    this.httpStatus = httpStatus
    this.name = 'HttpStatusError'
  }

  public get status(): ContentfulStatusCode {
    return this.httpStatus
  }
}

export class NotFoundError extends HttpStatusError {
  constructor(message: string = 'Not Found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends HttpStatusError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends HttpStatusError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class BadRequestError extends HttpStatusError {
  constructor(message: string = 'Bad Request') {
    super(message, 400)
    this.name = 'BadRequestError'
  }

  static UserOrPasswordIncorrect() {
    return new BadRequestError('User or password is incorrect')
  }

  static UsernameAlreadyExists() {
    return new BadRequestError('Username already exists')
  }
}

export class InternalServerError extends HttpStatusError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500)
    this.name = 'InternalServerError'
  }
}
