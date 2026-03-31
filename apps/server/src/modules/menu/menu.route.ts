import { OpenAPIHono } from '@hono/zod-openapi'
import { handleGetMenuTree } from '@server/src/modules/menu/menu.handler'
import { getMenuTreeRoute } from '@server/src/modules/menu/menu.openapi'

export const menuApp = new OpenAPIHono()
  .openapi(getMenuTreeRoute, handleGetMenuTree)
