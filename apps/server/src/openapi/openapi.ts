import { OpenAPIHono } from '@hono/zod-openapi'
import { BusinessError } from '@server/src/common/exception'
import { setUpSwagger } from '@server/src/openapi/swagger'

interface ApiConfig {
  apiBasePath: string
  title: string
  version: string
}

export function createApi(config: ApiConfig) {
  const api = new OpenAPIHono({
    defaultHook: (result, _c) => {
      if (!result.success) {
        throw BusinessError.BadRequest(result.error.message, 'ValidationError')
      }
    },
  })

  setUpSwagger(api, config)

  return api
}
