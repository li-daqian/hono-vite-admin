import type { GetUserProfileResponse } from '@admin/client'
import { getUserProfile } from '@admin/client'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as GetUserProfileResponse | null,
  }),

  actions: {
    setAccessToken(token: string) {
      this.accessToken = token
    },

    async fetchMe() {
      if (!this.user) {
        const userProfile = await getUserProfile<true>()
        this.user = userProfile.data
      }
    },

    reset() {
      this.accessToken = null
      this.user = null
    },
  },
})
