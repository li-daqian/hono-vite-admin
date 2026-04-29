import type { RouteHandler } from '@hono/zod-openapi'
import type {
  getAppConfigRoute,
  getAppSecurityPolicyRoute,
  updateAppSecurityPolicyRoute,
} from '@server/src/modules/app/app.openapi'
import type { AppSecurityPolicyUpdateRequest } from '@server/src/modules/app/app.schema'
import { appService } from '@server/src/modules/app/app.service'

export const handleGetAppConfig: RouteHandler<typeof getAppConfigRoute> = async (c) => {
  return c.json(appService.getConfig(), 200)
}

export const handleGetAppSecurityPolicy: RouteHandler<typeof getAppSecurityPolicyRoute> = async (c) => {
  return c.json(await appService.getSecurityPolicy(), 200)
}

export const handleUpdateAppSecurityPolicy: RouteHandler<typeof updateAppSecurityPolicyRoute> = async (c) => {
  const body = c.req.valid('json' as never) as AppSecurityPolicyUpdateRequest
  return c.json(await appService.updateSecurityPolicy(body), 200)
}
