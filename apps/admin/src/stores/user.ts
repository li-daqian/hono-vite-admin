import type { GetUserProfileResponse } from '@admin/client'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as GetUserProfileResponse | null,
  }),

  actions: {
    setProfile(profile: GetUserProfileResponse) {
      this.profile = profile
    },

    clearProfile() {
      this.profile = null
    },
  },
})
