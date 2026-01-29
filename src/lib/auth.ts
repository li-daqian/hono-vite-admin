import router from '@admin/router'
import { ROUTE_NAMES } from '@admin/router/route-name'
import { useAuthStore } from '@admin/stores/auth'
import { useMenuStore } from '@admin/stores/menu'
import { useUserStore } from '@admin/stores/user'

/**
 * Centralized authentication manager for logout operations
 */
export const AuthManager = {
  /**
   * Clear all authentication state and redirect to login
   */
  async logout(redirectToLogin: boolean = true): Promise<void> {
    const authStore = useAuthStore()
    const userStore = useUserStore()
    const menuStore = useMenuStore()

    authStore.clearAccessToken()
    userStore.reset()
    menuStore.reset()

    if (redirectToLogin && router.currentRoute.value.name !== ROUTE_NAMES.LOGIN) {
      const redirect = encodeURIComponent(window.location.href)
      await router.replace({ name: ROUTE_NAMES.LOGIN, query: { redirect } })
    }
  },
}
