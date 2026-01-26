import type { GetAuthMenusResponse } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: JSON.parse(localStorage.getItem('menus') ?? '[]') as GetAuthMenusResponse || [],
  }),

  actions: {
    setMenus(menus: GetAuthMenusResponse) {
      localStorage.setItem('menus', JSON.stringify(menus))
    },

    clearMenus() {
      localStorage.removeItem('menus')
    },
  },
})
