import { z } from '@hono/zod-openapi'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

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
  page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1)).openapi({ description: 'Page number for pagination', example: 1 }),
  pageSize: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(100)).openapi({ description: 'Number of items per page', example: 10 }),
  sort: z.preprocess(emptyStringToUndefined, z.string().nullable().default(null)).openapi({ description: 'Sorting criteria in the format "field direction" or "field direction, field direction", e.g. "createdAt desc, username asc"', example: 'createdAt desc, username asc' }),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export const PaginationMetaSchema = z.object({
  totalItem: z.number().int().openapi({ description: 'Total number of items', example: 100 }),
  totalPage: z.number().int().openapi({ description: 'Total number of pages', example: 10 }),
  page: z.number().int().openapi({ description: 'Current page number', example: 1 }),
  pageSize: z.number().int().openapi({ description: 'Number of items per page', example: 10 }),
  nextPage: z.number().int().nullable().openapi({ description: 'Next page number, null if current page is the last', example: 2 }),
  previousPage: z.number().int().nullable().openapi({ description: 'Previous page number, null if current page is the first', example: null }),
  hasNext: z.boolean().openapi({ description: 'Indicates if there is a next page', example: true }),
  hasPrevious: z.boolean().openapi({ description: 'Indicates if there is a previous page', example: false }),
  sort: z.string().nullable().openapi({ description: 'Sorting criteria used for the current page', example: 'createdAt desc, username asc' }),
})
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema).openapi({ description: 'List of items for the current page' }),
    meta: PaginationMetaSchema,
  }).openapi({
    description: 'Standard paginated response envelope',
  })
}

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<z.ZodType<T>>>>
