import type { GetAuthMenusResponse } from '@admin/client'
import type { Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import { routeMetaConfigMap } from '@admin/router/route-meta'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useMenuStore } from '@admin/stores/menu'

function buildRoutesFromMenus(menus: GetAuthMenusResponse): RouteRecordRaw[] {
  return menus
    .flatMap((menu) => {
      const routes: RouteRecordRaw[] = []

      if (menu.path !== null && menu.id in routeMetaConfigMap) {
        routes.push({
          path: menu.path,
          name: menu.name as RouteRecordNameGeneric,
          component: routeMetaConfigMap[menu.id as keyof typeof routeMetaConfigMap]!.component,
          meta: {
            requiresAuth: true,
            actions: menu.actions,
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
