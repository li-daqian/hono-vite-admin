import { API_V1_BASE_PATH } from '@server/src/common/constant'
import { authApp } from '@server/src/modules/auth/auth.route'
import { roleApp } from '@server/src/modules/role/role.route'
import { userApp } from '@server/src/modules/user/user.route'
import { createApi } from '@server/src/openapi/openapi'

const apiV1 = createApi({
  apiBasePath: API_V1_BASE_PATH,
  title: 'Hono-vite-admin API',
  version: '1.0.0',
})

apiV1.route('/auth', authApp)
apiV1.route('/role', roleApp)
apiV1.route('/user', userApp)

export { apiV1 }
