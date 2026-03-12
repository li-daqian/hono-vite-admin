import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
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
  UserUpdateRequestSchema,
} from '@server/src/modules/user/user.schema'

export const createUserRoute = createRoute({
  path: '/user',
  method: 'post',
  description: 'Create a new user',
  request: { body: { required: true, content: { 'application/json': { schema: UserCreateRequestSchema } } } },
  responses: {
    201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['User'],
})

export const getUserProfileRoute = createRoute({
  path: '/user/profile',
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
  path: '/user/page',
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
  path: '/user/{id}',
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
  middleware: [authMiddleware],
  tags: ['User'],
})

export const deleteUsersBatchRoute = createRoute({
  path: '/user/batch',
  method: 'delete',
  description: 'Batch delete users',
  request: {
    body: { required: true, content: { 'application/json': { schema: UserBatchDeleteRequestSchema } } },
  },
  responses: {
    200: { description: 'Users deleted successfully', content: { 'application/json': { schema: UserBatchDeleteResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['User'],
})

export const updateUserStatusBatchRoute = createRoute({
  path: '/user/status/batch',
  method: 'patch',
  description: 'Batch update user status',
  request: {
    body: { required: true, content: { 'application/json': { schema: UserBatchStatusUpdateRequestSchema } } },
  },
  responses: {
    200: { description: 'User status updated successfully', content: { 'application/json': { schema: UserBatchStatusUpdateResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['User'],
})
