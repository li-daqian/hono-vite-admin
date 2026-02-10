import type { GetUserProfileResponse } from '@admin/client'
import { getUserProfile, postAuthRefresh } from '@admin/client'
import { AuthManager } from '@admin/lib/auth'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as GetUserProfileResponse | null,
    refreshPromise: null as Promise<void> | null,
    logoutPromise: null as Promise<void> | null,
  }),

  actions: {
    setAccessToken(token: string) {
      this.accessToken = token
    },

    async refreshAccessToken(): Promise<void> {
      if (this.refreshPromise) {
        return this.refreshPromise
      }

      this.refreshPromise = (async () => {
        try {
          const response = await postAuthRefresh<true>({
            body: { refreshToken: null },
          })
          this.setAccessToken(response.data.accessToken)
        }
        finally {
          this.refreshPromise = null
        }
      })()

      return this.refreshPromise
    },

    async fetchMe() {
      if (!this.user) {
        await this.refreshAccessToken()
        const userProfile = await getUserProfile<true>()
        this.user = userProfile.data
      }
    },

    async logout(): Promise<void> {
      if (this.logoutPromise) {
        return this.logoutPromise
      }

      this.logoutPromise = AuthManager.logout(true)
      await this.logoutPromise
      this.logoutPromise = null
    },

    reset() {
      this.accessToken = null
      this.user = null
      this.refreshPromise = null
      this.logoutPromise = null
    },
  },
})
