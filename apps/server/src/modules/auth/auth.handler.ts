import type { RouteHandler } from '@hono/zod-openapi'
import type { authLoginRoute, authLogoutRoute, authMenusRoute, authPrefillRoute, authRefreshRoute } from '@server/src/modules/auth/auth.openapi'
import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/modules/auth/auth.schema'
import { refreshTokenCookie } from '@server/src/lib/cookie'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { authService } from '@server/src/modules/auth/auth.service'

export const handleAuthPrefill: RouteHandler<typeof authPrefillRoute> = async (c) => {
  const prefillData = await authService.getPrefilledCredentials()
  return c.json(prefillData, 200)
}

export const handleAuthLogin: RouteHandler<typeof authLoginRoute> = async (c) => {
  const body = await c.req.json() as AuthLoginRequest
  const loginResult = await authService.login(body)
  refreshTokenCookie.set(c, loginResult)
  return c.json(loginResult, 200)
}

export const handleAuthRefresh: RouteHandler<typeof authRefreshRoute> = async (c) => {
  const body = await c.req.json() as AuthRefreshRequest
  const refreshToken = body.refreshToken ?? refreshTokenCookie.get(c)
  const slideMode = !!body.refreshToken
  const refreshResult = await authService.refresh(refreshToken, slideMode)
  refreshTokenCookie.set(c, refreshResult)
  return c.json(refreshResult, 200)
}

export const handleAuthLogout: RouteHandler<typeof authLogoutRoute> = async (c) => {
  const refreshToken = refreshTokenCookie.get(c)
  const { userId } = getLoginUser(c)
  await authService.logout(userId, refreshToken)

  refreshTokenCookie.clear(c)

  return c.json({}, 200)
}

export const handleAuthMenus: RouteHandler<typeof authMenusRoute> = async (c) => {
  const { userId } = getLoginUser(c)
  const menus = await authService.getUserMenus(userId)
  return c.json(menus, 200)
}
