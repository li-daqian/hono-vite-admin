import type { AuthActionSchema } from '@admin/client'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from '@admin/lib/nprogress'
import { loadDynamicRoutes } from '@admin/router/dynamic-routes'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useAuthStore } from '@admin/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    actions?: Array<AuthActionSchema>
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.HOME,
    component: () => import('@admin/pages/HomePage.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@admin/pages/user/UserLoginPage.vue'),
    meta: {
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  if (loadDynamicRoutes(router)) {
    return next({ ...to, replace: true })
  }

  if (to.meta.requiresAuth) {
    await useAuthStore().fetchMe()
  }

  next()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
