import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateDepartment,
  handleDeleteDepartment,
  handleGetDepartmentDetail,
  handleGetDepartmentTree,
  handleReorderDepartments,
  handleUpdateDepartment,
} from '@server/src/modules/department/department.handler'
import {
  createDepartmentRoute,
  deleteDepartmentRoute,
  getDepartmentDetailRoute,
  getDepartmentTreeRoute,
  reorderDepartmentsRoute,
  updateDepartmentRoute,
} from '@server/src/modules/department/department.openapi'

export const departmentApp = new OpenAPIHono()
  .openapi(getDepartmentTreeRoute, handleGetDepartmentTree)
  .openapi(createDepartmentRoute, handleCreateDepartment)
  .openapi(getDepartmentDetailRoute, handleGetDepartmentDetail)
  .openapi(reorderDepartmentsRoute, handleReorderDepartments)
  .openapi(updateDepartmentRoute, handleUpdateDepartment)
  .openapi(deleteDepartmentRoute, handleDeleteDepartment)
