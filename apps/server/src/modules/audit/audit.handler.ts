import type { RouteHandler } from '@hono/zod-openapi'
import type { getAuditByIdRoute, getAuditPageRoute } from '@server/src/modules/audit/audit.openapi'
import { auditService } from '@server/src/modules/audit/audit.service'

export const handleGetAuditPage: RouteHandler<typeof getAuditPageRoute> = async (c) => {
  const query = c.req.valid('query')
  const auditLogs = await auditService.getAuditLogPage(query)
  return c.json(auditLogs, 200)
}

export const handleGetAuditById: RouteHandler<typeof getAuditByIdRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const auditLog = await auditService.getAuditLogById(id)
  return c.json(auditLog, 200)
}
