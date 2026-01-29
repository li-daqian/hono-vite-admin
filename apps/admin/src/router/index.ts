import type { RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import NProgress from '@admin/lib/nprogress'
import { addDynamicRoutes } from '@admin/router/dynamic-routes'
import { ROUTE_NAMES } from '@admin/router/route-name'
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const authWhitelist: RouteRecordNameGeneric[] = [ROUTE_NAMES.LOGIN, ROUTE_NAMES.NOT_FOUND]

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  if (to.name || !authWhitelist.includes(to.name)) {
    useUserStore().initProfile()

    if (addDynamicRoutes(router)) {
      return next({ ...to, replace: true })
    }
  }

  next()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
