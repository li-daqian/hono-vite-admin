import { OpenAPIHono } from '@hono/zod-openapi'
import { handleGetAppConfig } from '@server/src/modules/app/app.handler'
import { getAppConfigRoute } from '@server/src/modules/app/app.openapi'

export const appApp = new OpenAPIHono()
  .openapi(getAppConfigRoute, handleGetAppConfig)
