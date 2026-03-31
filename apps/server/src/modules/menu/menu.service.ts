import type { Action, Menu } from '@server/generated/prisma/client'
import type { MenuTreeResponse } from '@server/src/modules/menu/menu.schema'
import { prisma } from '@server/src/lib/prisma'

class MenuService {
  async getMenuTree(): Promise<MenuTreeResponse> {
    const [menus, actions] = await Promise.all([
      prisma.menu.findMany({ orderBy: { order: 'asc' } }),
      prisma.action.findMany(),
    ])

    return this.buildMenuTree(menus, actions)
  }

  private buildMenuTree(menus: Menu[], actions: Action[]): MenuTreeResponse {
    const menusByParentId = menus.reduce<Record<string, Menu[]>>((acc, menu) => {
      (acc[menu.parentId ?? ''] ??= []).push(menu)
      return acc
    }, {})

    const actionsByMenuId = actions.reduce<Record<string, Action[]>>((acc, action) => {
      (acc[action.menuId] ??= []).push(action)
      return acc
    }, {})

    const buildNode = (parentId: string): MenuTreeResponse => {
      const children = menusByParentId[parentId] ?? []
      return children.map(menu => ({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        order: menu.order,
        parentId: menu.parentId,
        actions: (actionsByMenuId[menu.id] ?? []).map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
        })),
        children: buildNode(menu.id),
      }))
    }

    return buildNode('')
  }
}

export const menuService = new MenuService()
