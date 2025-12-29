import type { OpenAPIHono, RouteConfig } from '@hono/zod-openapi'
import type { AuthLoginRequest, AuthLogoutRequest, AuthRefreshRequest } from '@server/src/schemas/auth.schema'
import { createRoute } from '@hono/zod-openapi'
import { AuthLoginRequestSchema, AuthLoginResponseSchema, AuthLogoutRequestSchema, AuthLogoutResponseSchema, AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@server/src/schemas/auth.schema'
import { authService } from '@server/src/service/auth.service'

export const authLoginRoute: RouteConfig = createRoute({
  method: 'post',
  path: '/api/v1/auth/login',
  request: { body: { content: { 'application/json': { schema: AuthLoginRequestSchema } } } },
  responses: { 200: { description: 'User logged in successfully', content: { 'application/json': { schema: AuthLoginResponseSchema } } } },
  tags: ['Auth'],
})

export const authRefreshRoute: RouteConfig = createRoute({
  method: 'post',
  path: '/api/v1/auth/refresh',
  request: { body: { content: { 'application/json': { schema: AuthRefreshRequestSchema } } } },
  responses: { 200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: AuthRefreshResponseSchema } } } },
  tags: ['Auth'],
})

export const authLogoutRoute: RouteConfig = createRoute({
  method: 'post',
  path: '/api/v1/auth/logout',
  request: { body: { content: { 'application/json': { schema: AuthLogoutRequestSchema } } } },
  responses: { 200: { description: 'User logged out successfully', content: { 'application/json': { schema: AuthLogoutResponseSchema } } } },
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
    const body = await c.req.json<AuthLogoutRequest>()
    await authService.logout(body)
    return c.json({})
  })
}
