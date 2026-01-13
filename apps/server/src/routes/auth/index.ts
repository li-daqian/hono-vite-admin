import type { OpenAPIHono } from '@hono/zod-openapi'
import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/routes/auth/schema'
import { createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { AuthLoginRequestSchema, AuthLoginResponseSchema, AuthPrefillResponseSchema, AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@server/src/routes/auth/schema'
import { authService } from '@server/src/service/auth.service'

export function authRoute(api: OpenAPIHono) {
  api.openapi(createRoute({
    path: '/auth/prefill',
    method: 'get',
    description: 'Get prefilled login credentials',
    responses: { 200: { description: 'Prefilled credentials retrieved successfully', content: { 'application/json': { schema: AuthPrefillResponseSchema } } } },
    tags: ['Auth'],
  }), async (c) => {
    const prefillData = await authService.getPrefilledCredentials()
    return c.json(prefillData)
  })

  api.openapi(createRoute({
    path: '/auth/login',
    method: 'post',
    description: 'User login',
    request: { body: { required: true, content: { 'application/json': { schema: AuthLoginRequestSchema } } } },
    responses: { 200: { description: 'User logged in successfully', content: { 'application/json': { schema: AuthLoginResponseSchema } } } },
    tags: ['Auth'],
  }), async (c) => {
    const body = await c.req.json<AuthLoginRequest>()
    const loginResult = await authService.login(body)
    return c.json(loginResult)
  })

  api.openapi(createRoute({
    path: '/auth/refresh',
    method: 'post',
    description: 'Refresh access token using refresh token',
    request: { body: { content: { 'application/json': { schema: AuthRefreshRequestSchema } } } },
    responses: { 200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: AuthRefreshResponseSchema } } } },
    tags: ['Auth'],
  }), async (c) => {
    const body = await c.req.json<AuthRefreshRequest>()
    const refreshResult = await authService.refresh(body)
    return c.json(refreshResult)
  })

  api.openapi(createRoute({
    path: '/auth/logout',
    method: 'post',
    description: 'User logout',
    responses: { 200: { description: 'User logged out successfully', content: { 'application/json': { schema: z.object({}) } } } },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['Auth'],
  }), async (c) => {
    await authService.logout()
    return c.json({})
  })
}
