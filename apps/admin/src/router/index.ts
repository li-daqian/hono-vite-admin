import type { RouteRecordRaw } from 'vue-router'
import NProgress from '@admin/lib/nprogress'
import { ROUTE_NAMES } from '@admin/router/route-name'
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
    component: () => import('@admin/pages/login/UserLoginPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(() => {
  NProgress.start()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
