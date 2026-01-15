import type { RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router'
import { getUserProfile } from '@admin/client/sdk.gen'
import NProgress from '@admin/lib/nprogress'
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

const authWhitelist: RouteRecordNameGeneric[] = [ROUTE_NAMES.LOGIN]

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  if (!authWhitelist.includes(to.name)) {
    const userProfile = await getUserProfile<true>()
    useUserStore().setProfile(userProfile.data)
  }

  next()
})
router.afterEach(() => {
  NProgress.done()
})

export default router
