import type { OpenAPIHono, RouteConfig } from '@hono/zod-openapi'
import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/routes/auth/schema'
import { createRoute } from '@hono/zod-openapi'
import { AuthLoginRequestSchema, AuthLoginResponseSchema, AuthLogoutRequestSchema, AuthLogoutResponseSchema, AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@server/src/routes/auth/schema'
import { authService } from '@server/src/service/auth.service'

export const authLoginRoute: RouteConfig = createRoute({
  description: 'User login',
  method: 'post',
  path: '/api/v1/auth/login',
  request: { body: { content: { 'application/json': { schema: AuthLoginRequestSchema } } } },
  responses: { 200: { description: 'User logged in successfully', content: { 'application/json': { schema: AuthLoginResponseSchema } } } },
  tags: ['Auth'],
})

export const authRefreshRoute: RouteConfig = createRoute({
  description: 'Refresh access token using refresh token',
  method: 'post',
  path: '/api/v1/auth/refresh',
  request: { body: { content: { 'application/json': { schema: AuthRefreshRequestSchema } } } },
  responses: { 200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: AuthRefreshResponseSchema } } } },
  tags: ['Auth'],
})

export const authLogoutRoute: RouteConfig = createRoute({
  description: 'User logout',
  method: 'post',
  path: '/api/v1/auth/logout',
  request: { body: { content: { 'application/json': { schema: AuthLogoutRequestSchema } } } },
  responses: { 200: { description: 'User logged out successfully', content: { 'application/json': { schema: AuthLogoutResponseSchema } } } },
  security: [{ Bearer: [] }],
  tags: ['Auth'],
})

export function authRoute(api: OpenAPIHono) {
  // User login api
  api.openapi(authLoginRoute, async (c) => {
    const body = await c.req.json<AuthLoginRequest>()
    const loginResult = await authService.login(body)
    return c.json(loginResult)
  })

  // Refresh access token using refresh token
  api.openapi(authRefreshRoute, async (c) => {
    const body = await c.req.json<AuthRefreshRequest>()
    const refreshResult = await authService.refresh(body)
    return c.json(refreshResult)
  })

  // Logout without generating OpenAPI docs
  api.openapi(authLogoutRoute, async (c) => {
    await authService.logout()
    return c.json({})
  })
}
