import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleCreateRole,
  handleDeleteRole,
  handleGetRoleDetail,
  handleGetRoleList,
  handleGetRolePermissions,
  handleUpdateRole,
  handleUpdateRolePermissions,
} from '@server/src/modules/role/role.handler'
import {
  createRoleRoute,
  deleteRoleRoute,
  getRoleDetailRoute,
  getRoleListRoute,
  getRolePermissionsRoute,
  updateRolePermissionsRoute,
  updateRoleRoute,
} from '@server/src/modules/role/role.openapi'

export const roleApp = new OpenAPIHono()
  .openapi(getRoleListRoute, handleGetRoleList)
  .openapi(createRoleRoute, handleCreateRole)
  .openapi(getRoleDetailRoute, handleGetRoleDetail)
  .openapi(updateRoleRoute, handleUpdateRole)
  .openapi(deleteRoleRoute, handleDeleteRole)
  .openapi(getRolePermissionsRoute, handleGetRolePermissions)
  .openapi(updateRolePermissionsRoute, handleUpdateRolePermissions)
