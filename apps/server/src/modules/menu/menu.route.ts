import { OpenAPIHono } from '@hono/zod-openapi'
import { handleGetMenuPermissionOptions, handleGetMenuTree } from '@server/src/modules/menu/menu.handler'
import { getMenuPermissionOptionsRoute, getMenuTreeRoute } from '@server/src/modules/menu/menu.openapi'

export const menuApp = new OpenAPIHono()
  .openapi(getMenuTreeRoute, handleGetMenuTree)
  .openapi(getMenuPermissionOptionsRoute, handleGetMenuPermissionOptions)
