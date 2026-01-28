import type { GetAuthMenusResponse } from '@admin/client'
import type { RouteComponent, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'

const componentMap: Record<string, RouteComponent> = {
  'dashboard': () => import('@admin/pages/DashboardPage.vue'),
  'system.user': () => import('@admin/pages/DashboardPage.vue'),
  'system.role': () => import('@admin/pages/DashboardPage.vue'),
}

export function buildRoutesFromMenus(menus: GetAuthMenusResponse): RouteRecordRaw[] {
  return menus
    .flatMap((menu) => {
      const routes: RouteRecordRaw[] = []

      if (menu.path !== null && componentMap[menu.id]) {
        routes.push({
          path: menu.path,
          name: menu.name as RouteRecordNameGeneric,
          component: componentMap[menu.id]!,
          meta: {
            title: menu.name,
            permissions: menu.actions,
          },
        })
      }

      const children = buildRoutesFromMenus(menu.children)

      routes.push(...children)

      return routes
    })
}
