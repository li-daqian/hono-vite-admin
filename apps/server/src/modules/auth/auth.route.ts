import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleAuthLogin,
  handleAuthLogout,
  handleAuthMenus,
  handleAuthPrefill,
  handleAuthRefresh,
} from '@server/src/modules/auth/auth.handler'
import {
  authLoginRoute,
  authLogoutRoute,
  authMenusRoute,
  authPrefillRoute,
  authRefreshRoute,
} from '@server/src/modules/auth/auth.openapi'

export const authApp = new OpenAPIHono()
  .openapi(authPrefillRoute, handleAuthPrefill)
  .openapi(authLoginRoute, handleAuthLogin)
  .openapi(authRefreshRoute, handleAuthRefresh)
  .openapi(authLogoutRoute, handleAuthLogout)
  .openapi(authMenusRoute, handleAuthMenus)
