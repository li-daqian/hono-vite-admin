import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { requireActionPermission } from '@server/src/middleware/permission.middleware'
import {
  UserBatchDeleteRequestSchema,
  UserBatchDeleteResponseSchema,
  UserBatchStatusUpdateRequestSchema,
  UserBatchStatusUpdateResponseSchema,
  UserCreateRequestSchema,
  UserCreateResponseSchema,
  UserPaginationRequestSchema,
  UserPaginationResponseSchema,
  UserProfileResponseSchema,
  UserUnlockResponseSchema,
  UserUpdatePasswordRequestSchema,
  UserUpdatePasswordResponseSchema,
  UserUpdateRequestSchema,
} from '@server/src/modules/user/user.schema'

const USER_ACTIONS = {
  CREATE: 'access.users.create',
  EDIT: 'access.users.edit',
  PASSWORD: 'access.users.password',
  UNLOCK: 'access.users.unlock',
  DELETE: 'access.users.delete',
} as const

export const getUserDetailRoute = createRoute({
  path: '/{id}',
  method: 'get',
  description: 'Get user detail by ID',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'User ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
  },
  responses: {
    200: { description: 'User detail retrieved successfully', content: { 'application/json': { schema: UserProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.EDIT)],
  tags: ['User'],
})

export const createUserRoute = createRoute({
  path: '',
  method: 'post',
  description: 'Create a new user',
  request: { body: { required: true, content: { 'application/json': { schema: UserCreateRequestSchema } } } },
  responses: {
    201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.CREATE)],
  tags: ['User'],
})

export const getUserProfileRoute = createRoute({
  path: '/profile',
  method: 'get',
  description: 'Get user profile',
  responses: {
    200: { description: 'User profile retrieved successfully', content: { 'application/json': { schema: UserProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['User'],
})

export const getUserPageRoute = createRoute({
  path: '/page',
  method: 'get',
  description: 'Get paginated list of users',
  request: {
    query: UserPaginationRequestSchema,
  },
  responses: {
    200: { description: 'User list retrieved successfully', content: { 'application/json': { schema: UserPaginationResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['User'],
})

export const updateUserRoute = createRoute({
  path: '/{id}',
  method: 'put',
  description: 'Update user',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'User ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
    body: { required: true, content: { 'application/json': { schema: UserUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'User updated successfully', content: { 'application/json': { schema: UserProfileResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.EDIT)],
  tags: ['User'],
})

export const updateUserPasswordRoute = createRoute({
  path: '/{id}/password',
  method: 'post',
  description: 'Update user password',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'User ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
    body: { required: true, content: { 'application/json': { schema: UserUpdatePasswordRequestSchema } } },
  },
  responses: {
    200: { description: 'User password updated successfully', content: { 'application/json': { schema: UserUpdatePasswordResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.PASSWORD)],
  tags: ['User'],
})

export const unlockUserRoute = createRoute({
  path: '/{id}/unlock',
  method: 'post',
  description: 'Unlock a user account',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'User ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
    }),
  },
  responses: {
    200: { description: 'User account unlocked successfully', content: { 'application/json': { schema: UserUnlockResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.UNLOCK)],
  tags: ['User'],
})

export const deleteUsersBatchRoute = createRoute({
  path: '/batch',
  method: 'delete',
  description: 'Batch delete users',
  request: {
    body: { required: true, content: { 'application/json': { schema: UserBatchDeleteRequestSchema } } },
  },
  responses: {
    200: { description: 'Users deleted successfully', content: { 'application/json': { schema: UserBatchDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.DELETE)],
  tags: ['User'],
})

export const updateUserStatusBatchRoute = createRoute({
  path: '/status/batch',
  method: 'patch',
  description: 'Batch update user status',
  request: {
    body: { required: true, content: { 'application/json': { schema: UserBatchStatusUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'User status updated successfully', content: { 'application/json': { schema: UserBatchStatusUpdateResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(USER_ACTIONS.EDIT)],
  tags: ['User'],
})
