import { createRoute } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { MenuTreeResponseSchema } from '@server/src/modules/menu/menu.schema'

export const getMenuTreeRoute: ReturnType<typeof createRoute> = createRoute({
  path: '',
  method: 'get',
  description: 'Get full menu tree with actions',
  responses: {
    200: { description: 'Menu tree retrieved successfully', content: { 'application/json': { schema: MenuTreeResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Menu'],
})
