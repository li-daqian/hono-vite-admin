import { OpenAPIHono } from '@hono/zod-openapi'
import {
  handleAuthChangePassword,
  handleAuthLogin,
  handleAuthLogout,
  handleAuthMenus,
  handleAuthPrefill,
  handleAuthRefresh,
} from '@server/src/modules/auth/auth.handler'
import {
  authChangePasswordRoute,
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
  .openapi(authChangePasswordRoute, handleAuthChangePassword)
  .openapi(authMenusRoute, handleAuthMenus)
