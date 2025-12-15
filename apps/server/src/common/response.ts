import type { HttpStatusError } from '@server/src/common/exception'
import type { Context } from 'hono'
import { requestId } from '@server/src/middleware/trace-logger'

export interface BaseResponse<T = any> {
  requestId: string
  ok: boolean
  data?: T
  pagination?: { page: number, limit: number, total: number }
  error?: { code: string, message: string }
}

export function okResponse<T = any>(data?: T): BaseResponse<T> {
  return { requestId: requestId(), ok: true, data }
}

export function errorResponse<T = any>(error: HttpStatusError): BaseResponse<T> {
  return { requestId: requestId(), error: { code: error.code, message: error.message }, ok: false }
}

export function internalServerErrorResponse(c: Context): Response {
  return c.json({ requestId: requestId(), error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, ok: false }, 500)
}

export function notFoundErrorResponse(c: Context): Response {
  return c.json({ requestId: requestId(), error: { code: 'NOT_FOUND', message: 'Not Found' }, ok: false }, 404)
}
