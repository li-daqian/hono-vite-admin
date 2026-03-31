import type { RouteHandler } from '@hono/zod-openapi'
import type { getMenuPermissionOptionsRoute, getMenuTreeRoute } from '@server/src/modules/menu/menu.openapi'
import { menuService } from '@server/src/modules/menu/menu.service'

export const handleGetMenuTree: RouteHandler<typeof getMenuTreeRoute> = async (c) => {
  const tree = await menuService.getMenuTree()
  return c.json(tree, 200)
}

export const handleGetMenuPermissionOptions: RouteHandler<typeof getMenuPermissionOptionsRoute> = async (c) => {
  const tree = await menuService.getMenuTree()
  return c.json(tree, 200)
}
