import { z } from '@hono/zod-openapi'

export const ErrorResponseSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  requestId: z.string(),
})
  .openapi({
    description: 'Standard error response envelope',
    example: {
      code: 'INVALID_INPUT',
      message: 'Invalid input provided',
      requestId: '01HFQ71P9M4Z3A2XK8N2X9C5V7',
    },
  })

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
