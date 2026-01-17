import type { OpenAPIHono } from '@hono/zod-openapi'
import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/schemas/auth.schema'
import { createRoute, z } from '@hono/zod-openapi'
import { refreshTokenCookie } from '@server/src/lib/cookie'
import { authMiddleware, getLoginUser } from '@server/src/middleware/auth.middleware'
import { AuthLoginRequestSchema, AuthLoginResponseSchema, AuthMenuResponseSchema, AuthPrefillResponseSchema, AuthRefreshRequestSchema, AuthRefreshResponseSchema } from '@server/src/schemas/auth.schema'
import { authService } from '@server/src/service/auth.service'

export function authRoute(api: OpenAPIHono) {
  api.openapi(createRoute({
    path: '/auth/prefill',
    method: 'get',
    description: 'Get prefilled login credentials',
    responses: {
      200: { description: 'Prefilled credentials retrieved successfully', content: { 'application/json': { schema: AuthPrefillResponseSchema } } },
    },
    tags: ['Auth'],
  }), async (c) => {
    const prefillData = await authService.getPrefilledCredentials()
    return c.json(prefillData, 200)
  })

  api.openapi(createRoute({
    path: '/auth/login',
    method: 'post',
    description: 'User login',
    request: { body: { required: true, content: { 'application/json': { schema: AuthLoginRequestSchema } } } },
    responses: {
      200: { description: 'User logged in successfully', content: { 'application/json': { schema: AuthLoginResponseSchema } } },
    },
    tags: ['Auth'],
  }), async (c) => {
    const body = await c.req.json<AuthLoginRequest>()
    const loginResult = await authService.login(body)
    refreshTokenCookie.set(c, loginResult)
    return c.json(loginResult, 200)
  })

  api.openapi(createRoute({
    path: '/auth/refresh',
    method: 'post',
    description: 'Refresh access token using refresh token',
    request: { body: { content: { 'application/json': { schema: AuthRefreshRequestSchema } } } },
    responses: {
      200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: AuthRefreshResponseSchema } } },
    },
    tags: ['Auth'],
  }), async (c) => {
    const body = await c.req.json<AuthRefreshRequest>()
    const refreshToken = body.refreshToken ?? refreshTokenCookie.get(c)
    const slideMode = !!body.refreshToken
    const refreshResult = await authService.refresh(refreshToken, slideMode)
    refreshTokenCookie.set(c, refreshResult)
    return c.json(refreshResult, 200)
  })

  api.openapi(createRoute({
    path: '/auth/logout',
    method: 'post',
    description: 'User logout',
    responses: {
      200: { description: 'User logged out successfully', content: { 'application/json': { schema: z.object({}) } } },
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['Auth'],
  }), async (c) => {
    const refreshToken = refreshTokenCookie.get(c)
    if (!refreshToken) {
      return c.json({}, 200)
    }

    const { userId } = getLoginUser(c)
    await authService.logout(userId, refreshToken)

    refreshTokenCookie.clear(c)

    return c.json({}, 200)
  })

  api.openapi(createRoute({
    path: '/auth/menus',
    method: 'get',
    description: 'Get user menus',
    responses: {
      200: { description: 'User menus retrieved successfully', content: { 'application/json': { schema: AuthMenuResponseSchema } } },
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['Auth'],
  }), async (c) => {
    const { userId } = getLoginUser(c)
    const menus = await authService.getUserMenus(userId)
    return c.json(menus, 200)
  })
}
