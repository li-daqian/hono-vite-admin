import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { BadRequestError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { authRoute } from '@server/src/routes/auth.route'
import { userRoute } from '@server/src/routes/user.route'

export const api = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw new BadRequestError(result.error.message)
    }
  },
})

if (!getEnv().isProduction) {
  // OpenAPI JSON
  api.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'Hono-vite-admin API',
      version: '1.0.0',
    },
  })
  // Swagger UI
  api.get('/docs', swaggerUI({ url: '/openapi.json' }))
}

authRoute(api)
userRoute(api)
