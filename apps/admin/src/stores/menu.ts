import type { AuthMenuSchema } from '@admin/client'
import type { BreadcrumbItemType } from '@admin/pages/home/components/AppBreadcrumb.vue'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as AuthMenuSchema[],
    currentPath: '',
  }),

  getters: {
    firstPathMenu(state): AuthMenuSchema | undefined {
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

    /**
     * based on current path build breadcrumb list
     */
    breadcrumb(state): BreadcrumbItemType[] {
      if (!state.currentPath) {
        return []
      }

      const pathStack: AuthMenuSchema[] = []

      const findPath = (
        menus: AuthMenuSchema[],
        parents: AuthMenuSchema[] = [],
      ): boolean => {
        for (const menu of menus) {
          const newParents = [...parents, menu]

          // find the menu with current path
          if (menu.path === state.currentPath) {
            pathStack.push(...newParents)
            return true
          }

          // if have children continue to find
          if (menu.children && menu.children.length > 0) {
            const found = findPath(menu.children, newParents)
            if (found)
              return true
          }
        }
        return false
      }

      findPath(state.menus)

      return pathStack.map((menu, _index) => ({
        label: menu.name,
        href: menu.path ? menu.path : undefined,
      }))
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
