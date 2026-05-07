import { OpenAPIHono } from '@hono/zod-openapi'
import { handleGetAuditById, handleGetAuditExport, handleGetAuditPage } from '@server/src/modules/audit/audit.handler'
import { getAuditByIdRoute, getAuditExportRoute, getAuditPageRoute } from '@server/src/modules/audit/audit.openapi'

export const auditApp = new OpenAPIHono()
  .openapi(getAuditPageRoute, handleGetAuditPage)
  .openapi(getAuditExportRoute, handleGetAuditExport)
  .openapi(getAuditByIdRoute, handleGetAuditById)
