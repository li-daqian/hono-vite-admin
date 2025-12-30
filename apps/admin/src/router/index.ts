import type { RouteRecordRaw } from 'vue-router'
import NProgress from '@admin/lib/nprogress'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@admin/pages/HomePage.vue'),
  },
  {
    path: '/login',
    component: () => import('@admin/pages/login/index.vue'),
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
