import { z } from '@hono/zod-openapi'

export const BaseResponseSchema = z.object({
  requestId: z.string().openapi({ description: 'Request ID for tracing', example: '01HQZX1Y2Z3456789ABCDEFGHI' }),
  ok: z.boolean().openapi({ description: 'Whether the request was successful', example: true }),
  pagination: z.object({
    page: z.number().openapi({ description: 'Current page number', example: 1 }),
    limit: z.number().openapi({ description: 'Number of items per page', example: 10 }),
    total: z.number().openapi({ description: 'Total number of items', example: 100 }),
  }).optional(),
  error: z.object({
    code: z.string().openapi({ description: 'Error code', example: 'NOT_FOUND' }),
    message: z.string().openapi({ description: 'Error message', example: 'The requested resource was not found.' }),
  }).optional(),
})
