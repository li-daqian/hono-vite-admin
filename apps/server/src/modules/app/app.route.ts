import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleGetAppConfig,
  handleGetAppSecurityPolicy,
  handleUpdateAppSecurityPolicy,
} from '@server/src/modules/app/app.handler'
import {
  getAppConfigRoute,
  getAppSecurityPolicyRoute,
  updateAppSecurityPolicyRoute,
} from '@server/src/modules/app/app.openapi'

export const appApp = new OpenAPIHono()
  .openapi(getAppConfigRoute, handleGetAppConfig)
  .openapi(getAppSecurityPolicyRoute, handleGetAppSecurityPolicy)
  .openapi(updateAppSecurityPolicyRoute, handleUpdateAppSecurityPolicy)
