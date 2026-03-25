import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import {
  RoleCreateRequestSchema,
  RoleCreateResponseSchema,
  RoleDeleteResponseSchema,
  RoleListResponseSchema,
  RoleProfileResponseSchema,
  RoleUpdateRequestSchema,
} from '@server/src/modules/role/role.schema'

export const getRoleDetailRoute = createRoute({
  path: '/{id}',
  method: 'get',
  description: 'Get role detail by ID',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Role ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
  },
  responses: {
    200: { description: 'Role detail retrieved successfully', content: { 'application/json': { schema: RoleProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Role'],
})

export const getRoleListRoute = createRoute({
  path: '',
  method: 'get',
  description: 'Get role list',
  responses: {
    200: { description: 'Role list retrieved successfully', content: { 'application/json': { schema: RoleListResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Role'],
})

export const createRoleRoute = createRoute({
  path: '',
  method: 'post',
  description: 'Create a new role',
  request: { body: { required: true, content: { 'application/json': { schema: RoleCreateRequestSchema } } } },
  responses: {
    201: { description: 'Role created successfully', content: { 'application/json': { schema: RoleCreateResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Role'],
})

export const updateRoleRoute = createRoute({
  path: '/{id}',
  method: 'put',
  description: 'Update role',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Role ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
    body: { required: true, content: { 'application/json': { schema: RoleUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'Role updated successfully', content: { 'application/json': { schema: RoleProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Role'],
})

export const deleteRoleRoute = createRoute({
  path: '/{id}',
  method: 'delete',
  description: 'Delete role',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Role ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
  },
  responses: {
    200: { description: 'Role deleted successfully', content: { 'application/json': { schema: RoleDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Role'],
})
