import { z } from '@hono/zod-openapi'

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
