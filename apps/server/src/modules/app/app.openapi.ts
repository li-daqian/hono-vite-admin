import { createRoute } from '@hono/zod-openapi'
import { AppConfigResponseSchema } from '@server/src/modules/app/app.schema'

export const getAppConfigRoute: ReturnType<typeof createRoute> = createRoute({
  path: '/config',
  method: 'get',
  description: 'Get public application bootstrap config',
  responses: {
    200: { description: 'Application config retrieved successfully', content: { 'application/json': { schema: AppConfigResponseSchema } } },
  },
  tags: ['App'],
})
