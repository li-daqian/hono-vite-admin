import type { HttpStatusError } from '@server/src/common/exception'
import type { Context } from 'hono'

export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ErrorResponse {
  code: string
  message: string
}

export function errorResponse(c: Context, error: HttpStatusError): Response {
  return c.json({ code: error.code, message: error.message }, error.httpStatus)
}

export function internalServerErrorResponse(c: Context): Response {
  return c.json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, 500)
}

export function notFoundErrorResponse(c: Context): Response {
  return c.json({ code: 'NOT_FOUND', message: 'Not Found' }, 404)
}
