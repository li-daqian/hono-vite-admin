import type { AuthActionSchema } from '@admin/client'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from '@admin/lib/nprogress'
import { ROUTE_NAMES } from '@admin/router/route-meta'
import { useAuthStore } from '@admin/stores/auth'
import { useMenuStore } from '@admin/stores/menu'
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
    component: () => import('@admin/pages/home/index.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@admin/pages/login/index.vue'),
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

  const menuStore = useMenuStore()

  if (to.name === ROUTE_NAMES.HOME) {
    // Redirect to first menu path.
    const firstMenuWithPath = menuStore.findFirstMenuWithPath
    if (firstMenuWithPath && firstMenuWithPath.path) {
      return next({ path: firstMenuWithPath.path, replace: true })
    }
  }

  if (to.meta.requiresAuth) {
    await useAuthStore().fetchMe()
  }

  menuStore.currentPath = to.path

  next()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
