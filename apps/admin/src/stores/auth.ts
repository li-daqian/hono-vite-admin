import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken,
  },

  actions: {
    setAccessToken(token: string) {
      this.accessToken = token
    },

    clearAccessToken() {
      this.accessToken = null
    },
  },
})
