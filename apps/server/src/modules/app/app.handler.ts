import type { RouteHandler } from '@hono/zod-openapi'
import type { getAppConfigRoute } from '@server/src/modules/app/app.openapi'
import { appService } from '@server/src/modules/app/app.service'

export const handleGetAppConfig: RouteHandler<typeof getAppConfigRoute> = async (c) => {
  return c.json(appService.getConfig(), 200)
}
