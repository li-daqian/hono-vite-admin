import type { GetAuthMenusResponse } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: JSON.parse(localStorage.getItem('menus') ?? '[]') as GetAuthMenusResponse || [],
    routesLoaded: false,
  }),

  actions: {
    setMenus(menus: GetAuthMenusResponse) {
      this.menus = menus
      localStorage.setItem('menus', JSON.stringify(menus))
    },

    setRoutesLoaded(loaded: boolean) {
      this.routesLoaded = loaded
    },

    reset() {
      this.menus = []
      this.routesLoaded = false
      localStorage.removeItem('menus')
    },
  },
})
