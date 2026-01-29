import type { PostAuthLoginResponse } from '@admin/client'
import router from '@admin/router'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useAuthStore } from '@admin/stores/auth'
import { useMenuStore } from '@admin/stores/menu'
import { useUserStore } from '@admin/stores/user'

/**
 * Centralized authentication manager
 */
export const AuthManager = {

  /**
   * Handle actions to perform on successful login
   */
  async onLoginSuccess(loginResponse: PostAuthLoginResponse): Promise<void> {
    const authStore = useAuthStore()
    const menuStore = useMenuStore()

    const accessToken = loginResponse.accessToken
    authStore.setAccessToken(accessToken)

    await menuStore.fetchMenus()

    const redirect = router.currentRoute.value.query.redirect
    if (redirect && typeof redirect === 'string') {
      window.location.href = decodeURIComponent(redirect)
    }
    else {
      await router.replace({ name: ROUTE_NAMES.HOME })
    }
  },

  /**
   * Clear all authentication state and redirect to login
   */
  async logout(shouldReturnToPreviousPage: boolean): Promise<void> {
    const authStore = useAuthStore()
    const userStore = useUserStore()
    const menuStore = useMenuStore()

    authStore.reset()
    userStore.reset()
    menuStore.reset()

    if (router.currentRoute.value.name !== ROUTE_NAMES.LOGIN) {
      if (shouldReturnToPreviousPage) {
        const redirect = encodeURIComponent(window.location.href)
        await router.replace({ name: ROUTE_NAMES.LOGIN, query: { redirect } })
      }
      else {
        await router.replace({ name: ROUTE_NAMES.LOGIN })
      }
    }
  },
}
