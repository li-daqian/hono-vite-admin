import type { AuthMenuSchema } from '@admin/client'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as AuthMenuSchema[],
    routesLoaded: false,
  }),

  getters: {
    flatMenus(state): AuthMenuSchema[] {
      const flatten = (menus: AuthMenuSchema[]): AuthMenuSchema[] => {
        return menus.reduce((acc, menu) => {
          acc.push(menu)
          if (menu.children && menu.children.length > 0) {
            acc.push(...flatten(menu.children))
          }
          return acc
        }, [] as AuthMenuSchema[])
      }
      return flatten(state.menus)
    },
  },

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
