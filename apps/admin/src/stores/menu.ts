import type { AuthMenuSchema } from '@admin/client'
import type { BreadcrumbItemType } from '@admin/pages/home/components/AppBreadcrumb.vue'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

function findMenuTrailByPath(
  menus: AuthMenuSchema[],
  targetPath: string,
  parents: AuthMenuSchema[] = [],
): AuthMenuSchema[] | undefined {
  for (const menu of menus) {
    const nextParents = [...parents, menu]

    if (menu.path === targetPath) {
      return nextParents
    }

    if (menu.children.length > 0) {
      const foundTrail = findMenuTrailByPath(menu.children, targetPath, nextParents)
      if (foundTrail) {
        return foundTrail
      }
    }
  }

  return undefined
}

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

    currentMenu(state): AuthMenuSchema | undefined {
      if (!state.currentPath) {
        return undefined
      }

      const trail = findMenuTrailByPath(state.menus, state.currentPath)
      return trail ? trail[trail.length - 1] : undefined
    },

    /**
     * based on current path build breadcrumb list
     */
    breadcrumb(state): BreadcrumbItemType[] {
      if (!state.currentPath) {
        return []
      }

      return (findMenuTrailByPath(state.menus, state.currentPath) ?? []).map(menu => ({
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

  persist: typeof window !== 'undefined'
    ? {
        storage: localStorage,
        pick: ['menus'],
      }
    : false,
})
