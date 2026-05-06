import type { AuthMenuSchema } from '@admin/client'
import type { BreadcrumbItemType } from '@admin/pages/home/components/AppBreadcrumb.vue'
import { getAuthMenus } from '@admin/client'
import { defineStore } from 'pinia'

function cloneMenu(menu: AuthMenuSchema): AuthMenuSchema {
  return {
    ...menu,
    actions: [...menu.actions],
    children: menu.children.map(cloneMenu),
  }
}

function mergeActions(left: AuthMenuSchema['actions'], right: AuthMenuSchema['actions']) {
  const actionsById = new Map(left.map(action => [action.id, action]))
  for (const action of right) {
    actionsById.set(action.id, action)
  }
  return [...actionsById.values()]
}

export function normalizeAuthMenus(menus: AuthMenuSchema[]): AuthMenuSchema[] {
  const normalizedMenus = menus.map(cloneMenu)
  const systemMenu = normalizedMenus.find(menu => menu.id === 'system')
  if (!systemMenu) {
    return normalizedMenus
  }

  const configMenu = systemMenu.children.find(menu => menu.id === 'system.configs')
  const securityPolicyMenu = systemMenu.children.find(menu => menu.id === 'system.security-policy')
  if (!securityPolicyMenu) {
    return normalizedMenus
  }

  if (!configMenu) {
    systemMenu.children = systemMenu.children.map((menu) => {
      if (menu.id !== 'system.security-policy') {
        return menu
      }

      return {
        ...menu,
        id: 'system.configs',
        name: 'System Config',
        path: '/system/configs',
      }
    })
    return normalizedMenus
  }

  configMenu.actions = mergeActions(configMenu.actions, securityPolicyMenu.actions)
  configMenu.children = [...configMenu.children, ...securityPolicyMenu.children]
  systemMenu.children = systemMenu.children.filter(menu => menu.id !== 'system.security-policy')

  return normalizedMenus
}

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
      this.menus = normalizeAuthMenus(menusResponse.data)
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
