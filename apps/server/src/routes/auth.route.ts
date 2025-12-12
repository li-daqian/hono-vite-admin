import type { OpenAPIHono, RouteConfig } from '@hono/zod-openapi'
import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/schemas/auth.schema'
import { createRoute } from '@hono/zod-openapi'
import { okResponse } from '@server/src/common/response'
import { AuthLoginRequestSchema, AuthLoginResponseSchema, AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@server/src/schemas/auth.schema'
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

export function authRoute(api: OpenAPIHono) {
  // User login api
  api.openapi(authLoginRoute, async (c) => {
    const body = await c.req.json<AuthLoginRequest>()
    const loginResult = await authService.login(body)
    return c.json(
      okResponse(loginResult),
      200,
    )
  })

  // Refresh access token using refresh token
  api.openapi(authRefreshRoute, async (c) => {
    const body = await c.req.json<AuthRefreshRequest>()
    const refreshResult = await authService.refresh(body)
    return c.json(
      okResponse(refreshResult),
      200,
    )
  })
}
