import type { AuthMenuSchema } from '@admin/client'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as AuthMenuSchema[],
    routesLoaded: false,
  }),

  actions: {
    async fetchMenus() {
      const menusResponse = await getAuthMenus<true>()
      this.menus = menusResponse.data
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
