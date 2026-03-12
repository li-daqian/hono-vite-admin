import type { OpenAPIHono } from '@hono/zod-openapi'
import { authRoute } from '@server/src/modules/auth/auth.route'
import { userRoute } from '@server/src/modules/user/user.route'

export function registerRoutes(api: OpenAPIHono) {
  authRoute(api)
  userRoute(api)
}
