import { OpenAPIHono } from '@hono/zod-openapi'
import { handleGetAuditById, handleGetAuditPage } from '@server/src/modules/audit/audit.handler'
import { getAuditByIdRoute, getAuditPageRoute } from '@server/src/modules/audit/audit.openapi'

export const auditApp = new OpenAPIHono()
  .openapi(getAuditPageRoute, handleGetAuditPage)
  .openapi(getAuditByIdRoute, handleGetAuditById)
