import type { RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import { getUserProfile } from '@admin/client/sdk.gen'
import NProgress from '@admin/lib/nprogress'
import { buildRoutesFromMenus } from '@admin/router/build-routes'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useMenuStore } from '@admin/stores/menu'
import { useUserStore } from '@admin/stores/user'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.HOME,
    component: () => import('@admin/pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@admin/pages/user/UserLoginPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: () => import('@admin/pages/error/NotFoundPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const authWhitelist: RouteRecordNameGeneric[] = [ROUTE_NAMES.LOGIN, ROUTE_NAMES.NOT_FOUND]

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  if (!authWhitelist.includes(to.name)) {
    const userProfile = await getUserProfile<true>()
    useUserStore().setProfile(userProfile.data)

    const useMenu = useMenuStore()
    if (!useMenu.routesLoaded) {
      const newRoutes = buildRoutesFromMenus(useMenu.menus)

      newRoutes.forEach((route) => {
        router.addRoute(ROUTE_NAMES.HOME, route)
      })
      useMenu.setRoutesLoaded(true)

      return next({ ...to, replace: true })
    }
  }

  next()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
