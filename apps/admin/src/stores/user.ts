import type { GetUserProfileResponse } from '@admin/client'
import { getUserProfile } from '@admin/client'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as GetUserProfileResponse | null,
  }),

  actions: {
    async initProfile() {
      if (!this.profile) {
        const userProfile = await getUserProfile<true>()
        this.profile = userProfile.data
      }
    },

    reset() {
      this.profile = null
    },
  },
})
