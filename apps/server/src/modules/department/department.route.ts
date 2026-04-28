import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleAssignDepartmentUsers,
  handleCreateDepartment,
  handleDeleteDepartment,
  handleGetDepartmentDetail,
  handleGetDepartmentTree,
  handleGetDepartmentUsers,
  handleReorderDepartments,
  handleUpdateDepartment,
} from '@server/src/modules/department/department.handler'
import {
  assignDepartmentUsersRoute,
  createDepartmentRoute,
  deleteDepartmentRoute,
  getDepartmentDetailRoute,
  getDepartmentTreeRoute,
  getDepartmentUsersRoute,
  reorderDepartmentsRoute,
  updateDepartmentRoute,
} from '@server/src/modules/department/department.openapi'

export const departmentApp = new OpenAPIHono()
  .openapi(getDepartmentTreeRoute, handleGetDepartmentTree)
  .openapi(createDepartmentRoute, handleCreateDepartment)
  .openapi(getDepartmentDetailRoute, handleGetDepartmentDetail)
  .openapi(reorderDepartmentsRoute, handleReorderDepartments)
  .openapi(getDepartmentUsersRoute, handleGetDepartmentUsers)
  .openapi(assignDepartmentUsersRoute, handleAssignDepartmentUsers)
  .openapi(updateDepartmentRoute, handleUpdateDepartment)
  .openapi(deleteDepartmentRoute, handleDeleteDepartment)
