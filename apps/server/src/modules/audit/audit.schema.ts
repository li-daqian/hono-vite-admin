import { z } from '@hono/zod-openapi'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@server/src/common/basic.schema'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

export const AUDIT_MODULE_VALUES = ['auth', 'user', 'role', 'department'] as const
export const AUDIT_CATEGORY_VALUES = ['login', 'operation'] as const

export const AuditModuleSchema = z.enum(AUDIT_MODULE_VALUES).openapi({
  description: 'Audited module identifier',
  example: 'user',
})
export type AuditModule = z.infer<typeof AuditModuleSchema>

export const AuditCategorySchema = z.enum(AUDIT_CATEGORY_VALUES).openapi({
  description: 'Audit log category',
  example: 'operation',
})
export type AuditCategory = z.infer<typeof AuditCategorySchema>

export const AuditLogListItemSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier of the audit log entry', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  category: AuditCategorySchema,
  module: AuditModuleSchema,
  action: z.string().openapi({ description: 'Audited action identifier', example: 'create' }),
  operatorId: z.string().nullable().openapi({ description: 'ID of the operator who performed the action when available', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  operatorUsername: z.string().openapi({ description: 'Username of the operator', example: 'admin' }),
  operatorDisplayName: z.string().nullable().openapi({ description: 'Display name of the operator when available', example: 'Administrator' }),
  method: z.string().openapi({ description: 'HTTP method of the audited request', example: 'POST' }),
  path: z.string().openapi({ description: 'Request path of the audited request', example: '/api/v1/user' }),
  ip: z.string().nullable().openapi({ description: 'Client IP address', example: '127.0.0.1' }),
  userAgent: z.string().nullable().openapi({ description: 'Client user agent', example: 'Mozilla/5.0' }),
  requestId: z.string().openapi({ description: 'Request ID associated with the audited request', example: 'req_1234567890' }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the audit log entry was created', example: '2024-01-01T12:00:00Z' }),
}).openapi('AuditLogListItemSchema')
export type AuditLogListItem = z.infer<typeof AuditLogListItemSchema>

export const AuditLogDetailResponseSchema = AuditLogListItemSchema.extend({
  requestSnapshot: z.any().nullable().openapi({
    description: 'Redacted snapshot of request parameters recorded for the audit entry',
    example: {
      username: 'johndoe',
      password: '[REDACTED]',
    },
  }),
}).openapi('AuditLogDetailResponseSchema')
export type AuditLogDetailResponse = z.infer<typeof AuditLogDetailResponseSchema>

export const AuditLogPaginationRequestSchema = PaginationQuerySchema.extend({
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().max(100).nullable().default(null),
  ).openapi({
    description: 'Search audit logs by operator, action, path, request ID, or IP address',
    example: 'admin',
  }),
  categories: z.preprocess(
    (value) => {
      if (value === '') {
        return undefined
      }

      if (typeof value === 'string') {
        return [value]
      }

      return value
    },
    z.array(AuditCategorySchema).nullable().default(null),
  ).openapi({
    description: 'Filter audit logs by one or more category identifiers',
    example: ['operation'],
  }),
  modules: z.preprocess(
    (value) => {
      if (value === '') {
        return undefined
      }

      if (typeof value === 'string') {
        return [value]
      }

      return value
    },
    z.array(AuditModuleSchema).nullable().default(null),
  ).openapi({
    description: 'Filter audit logs by one or more module identifiers',
    example: ['user'],
  }),
})
export type AuditLogPaginationRequest = z.infer<typeof AuditLogPaginationRequestSchema>

export const AuditLogPaginationResponseSchema = PaginatedResponseSchema(AuditLogListItemSchema)
export type AuditLogPaginationResponse = z.infer<typeof AuditLogPaginationResponseSchema>
