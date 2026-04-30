import { API_V1_BASE_PATH } from '@server/src/common/constant'
import { appApp } from '@server/src/modules/app/app.route'
import { auditApp } from '@server/src/modules/audit/audit.route'
import { authApp } from '@server/src/modules/auth/auth.route'
import { departmentApp } from '@server/src/modules/department/department.route'
import { menuApp } from '@server/src/modules/menu/menu.route'
import { roleApp } from '@server/src/modules/role/role.route'
import { systemApp } from '@server/src/modules/system/system.route'
import { userApp } from '@server/src/modules/user/user.route'
import { createApi } from '@server/src/openapi/openapi'

const apiV1 = createApi({
  apiBasePath: API_V1_BASE_PATH,
  title: 'Hono-vite-admin API',
  version: '1.0.0',
})

apiV1.route('/app', appApp)
apiV1.route('/audit', auditApp)
apiV1.route('/auth', authApp)
apiV1.route('/department', departmentApp)
apiV1.route('/menu', menuApp)
apiV1.route('/role', roleApp)
apiV1.route('/system', systemApp)
apiV1.route('/user', userApp)

export { apiV1 }
