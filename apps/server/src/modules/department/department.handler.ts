import type { RouteHandler } from '@hono/zod-openapi'
import type {
  createDepartmentRoute,
  deleteDepartmentRoute,
  getDepartmentDetailRoute,
  getDepartmentTreeRoute,
  updateDepartmentRoute,
} from '@server/src/modules/department/department.openapi'
import { departmentService } from '@server/src/modules/department/department.service'

export const handleCreateDepartment: RouteHandler<typeof createDepartmentRoute> = async (c) => {
  const body = c.req.valid('json')
  const createdDepartment = await departmentService.createDepartment(body)
  return c.json(createdDepartment, 201)
}

export const handleGetDepartmentTree: RouteHandler<typeof getDepartmentTreeRoute> = async (c) => {
  const query = c.req.valid('query')
  const departments = await departmentService.getDepartmentTree(query)
  return c.json(departments, 200)
}

export const handleGetDepartmentDetail: RouteHandler<typeof getDepartmentDetailRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const department = await departmentService.getDepartmentById(id)
  return c.json(department, 200)
}

export const handleUpdateDepartment: RouteHandler<typeof updateDepartmentRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const department = await departmentService.updateDepartment(id, body)
  return c.json(department, 200)
}

export const handleDeleteDepartment: RouteHandler<typeof deleteDepartmentRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await departmentService.deleteDepartment(id)
  return c.json(result, 200)
}
