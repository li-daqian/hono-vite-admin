import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleAuthLogin,
  handleAuthLogout,
  handleAuthMenus,
  handleAuthPrefill,
  handleAuthRefresh,
} from '@server/src/routes/auth.handler'
import {
  authLoginRoute,
  authLogoutRoute,
  authMenusRoute,
  authPrefillRoute,
  authRefreshRoute,
} from '@server/src/routes/auth.openapi'

export function authRoute(api: OpenAPIHono) {
  api.openapi(authPrefillRoute, handleAuthPrefill)
  api.openapi(authLoginRoute, handleAuthLogin)
  api.openapi(authRefreshRoute, handleAuthRefresh)
  api.openapi(authLogoutRoute, handleAuthLogout)
  api.openapi(authMenusRoute, handleAuthMenus)
}
