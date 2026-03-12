import type { AuthLoginRequest, AuthRefreshRequest } from '@server/src/modules/auth/auth.schema'
import { refreshTokenCookie } from '@server/src/lib/cookie'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { authService } from '@server/src/modules/auth/auth.service'

export async function handleAuthPrefill(c: any) {
  const prefillData = await authService.getPrefilledCredentials()
  return c.json(prefillData, 200)
}

export async function handleAuthLogin(c: any) {
  const body = await c.req.json() as AuthLoginRequest
  const loginResult = await authService.login(body)
  refreshTokenCookie.set(c, loginResult)
  return c.json(loginResult, 200)
}

export async function handleAuthRefresh(c: any) {
  const body = await c.req.json() as AuthRefreshRequest
  const refreshToken = body.refreshToken ?? refreshTokenCookie.get(c)
  const slideMode = !!body.refreshToken
  const refreshResult = await authService.refresh(refreshToken, slideMode)
  refreshTokenCookie.set(c, refreshResult)
  return c.json(refreshResult, 200)
}

export async function handleAuthLogout(c: any) {
  const refreshToken = refreshTokenCookie.get(c)
  if (!refreshToken) {
    return c.json({}, 200)
  }

  const { userId } = getLoginUser(c)
  await authService.logout(userId, refreshToken)

  refreshTokenCookie.clear(c)

  return c.json({}, 200)
}

export async function handleAuthMenus(c: any) {
  const { userId } = getLoginUser(c)
  const menus = await authService.getUserMenus(userId)
  return c.json(menus, 200)
}
