import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { BadRequestError } from '@server/src/common/exception'
import { registerUserRoute } from '@server/src/routes/user.route'

export const api = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      throw new BadRequestError(result.error.message)
    }
  },
})

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

registerUserRoute(api)
