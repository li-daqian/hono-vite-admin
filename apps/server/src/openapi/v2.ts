import { API_V2_BASE_PATH } from '@server/src/common/constant'
import { createApi } from '@server/src/openapi/openapi'

const apiV2 = createApi({
  basePath: API_V2_BASE_PATH,
  title: 'Hono-vite-admin API',
  version: '2.0.0',
})

export { apiV2 }
