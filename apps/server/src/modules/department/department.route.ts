import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateDepartment,
  handleDeleteDepartment,
  handleGetDepartmentDetail,
  handleGetDepartmentTree,
  handleUpdateDepartment,
} from '@server/src/modules/department/department.handler'
import {
  createDepartmentRoute,
  deleteDepartmentRoute,
  getDepartmentDetailRoute,
  getDepartmentTreeRoute,
  updateDepartmentRoute,
} from '@server/src/modules/department/department.openapi'

export const departmentApp = new OpenAPIHono()
  .openapi(getDepartmentTreeRoute, handleGetDepartmentTree)
  .openapi(createDepartmentRoute, handleCreateDepartment)
  .openapi(getDepartmentDetailRoute, handleGetDepartmentDetail)
  .openapi(updateDepartmentRoute, handleUpdateDepartment)
  .openapi(deleteDepartmentRoute, handleDeleteDepartment)
