import { OpenAPIHono } from '@hono/zod-openapi'
import { BusinessError } from '@server/src/common/exception'
import { registerRoutes } from '@server/src/openapi/registerRoutes'
import { setUpSwagger } from '@server/src/openapi/swagger'

const openApi = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw BusinessError.BadRequest(result.error.message, 'ValidationError')
    }
  },
})

setUpSwagger(openApi)

registerRoutes(openApi)

export { openApi }
