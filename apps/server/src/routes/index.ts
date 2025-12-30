import type { OpenAPIHono } from '@hono/zod-openapi'
import { authRoute } from '@server/src/routes/auth'
import { userRoute } from '@server/src/routes/user'

export function registerRoutes(api: OpenAPIHono) {
  authRoute(api)
  userRoute(api)
}
