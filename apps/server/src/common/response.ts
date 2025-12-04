import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HttpStatusError } from '@server/src/common/exception'
import { requestId } from '@server/src/middleware/trace-logger'

export interface Response<T = any> {
  requestId: string
  code: ContentfulStatusCode
  ok: boolean
  message: string
  data?: T
}

export function okResponse<T = any>(data?: T): Response<T> {
  return { requestId: requestId(), code: 200, ok: true, message: 'OK', data }
}

export function errorResponse<T = any>(error: Error): Response<T> {
  if (error instanceof HttpStatusError) {
    return { requestId: requestId(), code: error.status, ok: false, message: error.message }
  }
  else {
    return { requestId: requestId(), code: 500, ok: false, message: 'Internal Server Error' }
  }
}
