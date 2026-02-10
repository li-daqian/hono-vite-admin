import type { AuthMenuSchema } from '@admin/client'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as AuthMenuSchema[],
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

    reset() {
      this.menus = []
    },
  },

  persist: {
    storage: localStorage,
    pick: ['menus'],
  },
})
