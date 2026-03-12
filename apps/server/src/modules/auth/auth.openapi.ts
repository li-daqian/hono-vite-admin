import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import {
  AuthLoginRequestSchema,
  AuthLoginResponseSchema,
  AuthMenuResponseSchema,
  AuthPrefillResponseSchema,
  AuthRefreshRequestSchema,
  AuthRefreshResponseSchema,
} from '@server/src/modules/auth/auth.schema'

export const authPrefillRoute = createRoute({
  path: '/prefill',
  method: 'get',
  description: 'Get prefilled login credentials',
  responses: {
    200: { description: 'Prefilled credentials retrieved successfully', content: { 'application/json': { schema: AuthPrefillResponseSchema } } },
  },
  tags: ['Auth'],
})

export const authLoginRoute = createRoute({
  path: '/login',
  method: 'post',
  description: 'User login',
  request: { body: { required: true, content: { 'application/json': { schema: AuthLoginRequestSchema } } } },
  responses: {
    200: { description: 'User logged in successfully', content: { 'application/json': { schema: AuthLoginResponseSchema } } },
  },
  tags: ['Auth'],
})

export const authRefreshRoute = createRoute({
  path: '/refresh',
  method: 'post',
  description: 'Refresh access token using refresh token',
  request: { body: { content: { 'application/json': { schema: AuthRefreshRequestSchema } } } },
  responses: {
    200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: AuthRefreshResponseSchema } } },
  },
  tags: ['Auth'],
})

export const authLogoutRoute = createRoute({
  path: '/logout',
  method: 'post',
  description: 'User logout',
  responses: {
    200: { description: 'User logged out successfully', content: { 'application/json': { schema: z.object({}) } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Auth'],
})

export const authMenusRoute = createRoute({
  path: '/menus',
  method: 'get',
  description: 'Get user menus',
  responses: {
    200: { description: 'User menus retrieved successfully', content: { 'application/json': { schema: AuthMenuResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['Auth'],
})
