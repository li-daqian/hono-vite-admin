import type { AuthMenuSchema } from '@admin/client'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as AuthMenuSchema[],
    routesLoaded: false,
  }),

  getters: {
    findFirstMenuWithPath(state): AuthMenuSchema | undefined {
      const find = (menus: AuthMenuSchema[]): AuthMenuSchema | undefined => {
        for (const menu of menus) {
          if (menu.path)
            return menu
          if (menu.children && menu.children.length > 0) {
            const found = find(menu.children)
            if (found)
              return found
          }
        }
        return undefined
      }
      return find(state.menus)
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
