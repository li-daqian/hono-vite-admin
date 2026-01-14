import { OpenAPIHono } from '@hono/zod-openapi'
import { BusinessError } from '@server/src/common/exception'
import { registerRoutes } from '@server/src/openapi/registerRoutes'
import { setUpSwagger } from '@server/src/openapi/swagger'

const api = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw BusinessError.BadRequest(result.error.message, 'ValidationError')
    }
  },
})

setUpSwagger(api)

registerRoutes(api)

export { api }
