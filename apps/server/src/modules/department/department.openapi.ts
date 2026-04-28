import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { requireActionPermission } from '@server/src/middleware/permission.middleware'
import {
  DepartmentCreateRequestSchema,
  DepartmentDeleteResponseSchema,
  DepartmentListRequestSchema,
  DepartmentProfileResponseSchema,
  DepartmentReorderRequestSchema,
  DepartmentReorderResponseSchema,
  DepartmentTreeResponseSchema,
  DepartmentUpdateRequestSchema,
} from '@server/src/modules/department/department.schema'

const DEPARTMENT_ACTIONS = {
  CREATE: 'access.departments.create',
  EDIT: 'access.departments.edit',
  DELETE: 'access.departments.delete',
} as const

const DepartmentIdParamSchema = z.object({
  id: z.string().openapi({ description: 'Department ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
})

export const getDepartmentTreeRoute = createRoute({
  path: '',
  method: 'get',
  description: 'Get department tree',
  request: {
    query: DepartmentListRequestSchema,
  },
  responses: {
    200: { description: 'Department tree retrieved successfully', content: { 'application/json': { schema: DepartmentTreeResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Department'],
})

export const getDepartmentDetailRoute = createRoute({
  path: '/{id}',
  method: 'get',
  description: 'Get department detail by ID',
  request: {
    params: DepartmentIdParamSchema,
  },
  responses: {
    200: { description: 'Department detail retrieved successfully', content: { 'application/json': { schema: DepartmentProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(DEPARTMENT_ACTIONS.EDIT)],
  tags: ['Department'],
})

export const createDepartmentRoute = createRoute({
  path: '',
  method: 'post',
  description: 'Create a new department',
  request: { body: { required: true, content: { 'application/json': { schema: DepartmentCreateRequestSchema } } } },
  responses: {
    201: { description: 'Department created successfully', content: { 'application/json': { schema: DepartmentProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(DEPARTMENT_ACTIONS.CREATE)],
  tags: ['Department'],
})

export const updateDepartmentRoute = createRoute({
  path: '/{id}',
  method: 'put',
  description: 'Update department',
  request: {
    params: DepartmentIdParamSchema,
    body: { required: true, content: { 'application/json': { schema: DepartmentUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'Department updated successfully', content: { 'application/json': { schema: DepartmentProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(DEPARTMENT_ACTIONS.EDIT)],
  tags: ['Department'],
})

export const reorderDepartmentsRoute = createRoute({
  path: '/reorder',
  method: 'patch',
  description: 'Reorder departments',
  request: { body: { required: true, content: { 'application/json': { schema: DepartmentReorderRequestSchema } } } },
  responses: {
    200: { description: 'Departments reordered successfully', content: { 'application/json': { schema: DepartmentReorderResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(DEPARTMENT_ACTIONS.EDIT)],
  tags: ['Department'],
})

export const deleteDepartmentRoute = createRoute({
  path: '/{id}',
  method: 'delete',
  description: 'Delete department',
  request: {
    params: DepartmentIdParamSchema,
  },
  responses: {
    200: { description: 'Department deleted successfully', content: { 'application/json': { schema: DepartmentDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(DEPARTMENT_ACTIONS.DELETE)],
  tags: ['Department'],
})
