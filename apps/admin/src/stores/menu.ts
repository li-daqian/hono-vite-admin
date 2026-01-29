import type { GetAuthMenusResponse } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as GetAuthMenusResponse,
    routesLoaded: false,
  }),

  actions: {
    setMenus(menus: GetAuthMenusResponse) {
      this.menus = menus
    },

    setRoutesLoaded(loaded: boolean) {
      this.routesLoaded = loaded
    },

    reset() {
      this.menus = []
      this.routesLoaded = false
    },
  },

  persist: {
    storage: localStorage,
    pick: ['menus'],
  },
})
