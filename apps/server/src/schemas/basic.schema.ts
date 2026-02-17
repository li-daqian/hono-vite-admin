import { z } from '@hono/zod-openapi'

export const ErrorResponseSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  requestId: z.string(),
}).openapi({
  description: 'Standard error response envelope',
  example: {
    code: 'INVALID_INPUT',
    message: 'Invalid input provided',
    requestId: '01HFQ71P9M4Z3A2XK8N2X9C5V7',
  },
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

export const PaginationQuerySchema = z.object({
  page: z.number().int().min(1).default(1).openapi({ description: 'Page number for pagination', example: 1 }),
  pageSize: z.number().int().min(1).max(100).default(10).openapi({ description: 'Number of items per page', example: 10 }),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export const PaginationMetaSchema = z.object({
  total: z.number().int().openapi({ description: 'Total number of items', example: 100 }),
  page: z.number().int().openapi({ description: 'Current page number', example: 1 }),
  pageSize: z.number().int().openapi({ description: 'Number of items per page', example: 10 }),
})
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema).openapi({ description: 'List of items for the current page' }),
    meta: PaginationMetaSchema,
  }).openapi({
    description: 'Standard paginated response envelope',
  })
}
export type PaginatedResponse<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>
