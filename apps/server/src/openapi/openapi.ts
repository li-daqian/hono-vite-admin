import { OpenAPIHono } from '@hono/zod-openapi'
import { BusinessError } from '@server/src/common/exception'
import { authApp } from '@server/src/modules/auth/auth.route'
import { userApp } from '@server/src/modules/user/user.route'
import { setUpSwagger } from '@server/src/openapi/swagger'

const openApi = new OpenAPIHono({
  defaultHook: (result, _c) => {
    if (!result.success) {
      throw BusinessError.BadRequest(result.error.message, 'ValidationError')
    }
  },
})

setUpSwagger(openApi)

openApi.route('/auth', authApp)
openApi.route('/user', userApp)

export { openApi }
