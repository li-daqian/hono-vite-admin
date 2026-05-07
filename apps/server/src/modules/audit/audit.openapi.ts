import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import {
  AuditLogDetailResponseSchema,
  AuditLogExportRequestSchema,
  AuditLogPaginationRequestSchema,
  AuditLogPaginationResponseSchema,
} from '@server/src/modules/audit/audit.schema'

export const getAuditPageRoute = createRoute({
  path: '/page',
  method: 'get',
  description: 'Get paginated audit logs',
  request: {
    query: AuditLogPaginationRequestSchema,
  },
  responses: {
    200: { description: 'Audit logs retrieved successfully', content: { 'application/json': { schema: AuditLogPaginationResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Audit'],
})

export const getAuditByIdRoute = createRoute({
  path: '/{id}',
  method: 'get',
  description: 'Get audit log detail by ID',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Audit log ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
  },
  responses: {
    200: { description: 'Audit log detail retrieved successfully', content: { 'application/json': { schema: AuditLogDetailResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Audit'],
})

export const getAuditExportRoute = createRoute({
  path: '/export',
  method: 'get',
  description: 'Export audit logs as CSV',
  request: {
    query: AuditLogExportRequestSchema,
  },
  responses: {
    200: {
      description: 'Audit logs exported successfully',
      content: {
        'text/csv': {
          schema: z.string().openapi({
            description: 'CSV file content',
          }),
        },
      },
    },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Audit'],
})
