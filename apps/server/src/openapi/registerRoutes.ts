import type { OpenAPIHono } from '@hono/zod-openapi'
import { authRoute } from '@server/src/routes/auth.route'
import { userRoute } from '@server/src/routes/user.route'

export function registerRoutes(api: OpenAPIHono) {
  authRoute(api)
  userRoute(api)
}
