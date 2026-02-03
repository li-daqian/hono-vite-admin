import type { MenuItem } from '@admin/stores/menu'
import type { Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import { ROUTE_NAMES, routeMetaConfigMap } from '@admin/router/route-meta'
import { useMenuStore } from '@admin/stores/menu'

function buildRoutesFromMenus(menus: MenuItem[]): RouteRecordRaw[] {
  return menus
    .flatMap((menu) => {
      const routes: RouteRecordRaw[] = []

      if (menu.path && menu.name) {
        const routeMetaConfig = routeMetaConfigMap[menu.id]
        if (routeMetaConfig?.component) {
          routes.push({
            path: menu.path,
            name: menu.name as RouteRecordNameGeneric,
            component: routeMetaConfig.component,
            meta: {
              requiresAuth: true,
              actions: menu.actions,
            },
          })
        }
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
