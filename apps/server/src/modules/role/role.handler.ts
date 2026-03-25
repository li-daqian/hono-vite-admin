import type { RouteHandler } from '@hono/zod-openapi'
import type { createRoleRoute, deleteRoleRoute, getRoleDetailRoute, getRoleListRoute, updateRoleRoute } from '@server/src/modules/role/role.openapi'
import { roleService } from '@server/src/modules/role/role.service'

export const handleCreateRole: RouteHandler<typeof createRoleRoute> = async (c) => {
  const body = c.req.valid('json')
  const createdRole = await roleService.createRole(body)
  return c.json(createdRole, 201)
}

export const handleGetRoleDetail: RouteHandler<typeof getRoleDetailRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const role = await roleService.getRoleById(id)
  return c.json(role, 200)
}

export const handleGetRoleList: RouteHandler<typeof getRoleListRoute> = async (c) => {
  const roleList = await roleService.getRoleList()
  return c.json(roleList, 200)
}

export const handleUpdateRole: RouteHandler<typeof updateRoleRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const updatedRole = await roleService.updateRole(id, body)
  return c.json(updatedRole, 200)
}

export const handleDeleteRole: RouteHandler<typeof deleteRoleRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await roleService.deleteRole(id)
  return c.json(result, 200)
}
