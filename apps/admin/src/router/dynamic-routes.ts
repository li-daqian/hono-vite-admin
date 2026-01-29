import type { GetAuthMenusResponse } from '@admin/client'
import type { RouteComponent, Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useMenuStore } from '@admin/stores/menu'

const componentMap: Record<string, RouteComponent> = {
  'dashboard': () => import('@admin/pages/DashboardPage.vue'),
  'system.user': () => import('@admin/pages/DashboardPage.vue'),
  'system.role': () => import('@admin/pages/DashboardPage.vue'),
}

function buildRoutesFromMenus(menus: GetAuthMenusResponse): RouteRecordRaw[] {
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
            requiresAuth: true,
          },
        })
      }

      const children = buildRoutesFromMenus(menu.children)

      routes.push(...children)

      return routes
    })
}

export function loadDynamicRoutes(router: Router): boolean {
  const useMenu = useMenuStore()

  if (useMenu.routesLoaded) {
    return false
  }

  const newRoutes = buildRoutesFromMenus(useMenu.menus)
  newRoutes.forEach((route) => {
    router.addRoute(ROUTE_NAMES.HOME, route)
  })

  router.addRoute(ROUTE_NAMES.HOME, {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: () => import('@admin/pages/error/NotFoundPage.vue'),
    meta: {
      requiresAuth: true,
    },
  })

  useMenu.setRoutesLoaded(true)

  return true
}
