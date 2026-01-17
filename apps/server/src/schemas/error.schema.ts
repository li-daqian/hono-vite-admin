import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from '@hono/zod-openapi'
import { getRequestId } from '@server/src/middleware/requestId.middleware'

export const ErrorResponseSchema = z.object({
  type: z.string(),
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
})
  .openapi({
    description: 'Standard error response envelope',
    example: {
      type: 'Bad Request',
      code: 'INVALID_INPUT',
      message: 'Invalid input provided',
      requestId: '01HFQ71P9M4Z3A2XK8N2X9C5V7',
    },
  })

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  type: string,
  message: string,
  code = '',
): Response {
  const body: ErrorResponse = {
    type,
    code,
    message,
    requestId: getRequestId(),
  }

  return c.json(body, status)
}

export function internalError(c: Context) {
  return errorResponse(c, 500, 'Internal Server Error', 'An internal server error occurred')
}

export function notFoundError(c: Context) {
  return errorResponse(c, 404, 'Not Found', 'The requested resource was not found')
}
