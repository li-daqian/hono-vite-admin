import type { AuthMenuSchema, GetAuthMenusResponse } from '@admin/client'
import type { LucideIcon } from 'lucide-vue-next'
import type { RouteComponent } from 'vue-router'
import { getAuthMenus } from '@admin/client'
import { routeMetaConfigMap } from '@admin/router/route-meta'
import { defineStore } from 'pinia'

export type MenuItem = Omit<AuthMenuSchema, 'children'> & {
  children: MenuItem[]
  component?: RouteComponent
  icon?: LucideIcon
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as MenuItem[],
    routesLoaded: false,
  }),

  actions: {
    async fetchMenus() {
      const menusResponse = await getAuthMenus<true>()
      this.menus = buildMenuItems(menusResponse.data)
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

function buildMenuItems(menus: GetAuthMenusResponse): MenuItem[] {
  return menus
    .map((menu) => {
      const menuItem: MenuItem = {
        ...menu,
        icon: routeMetaConfigMap[menu.id]?.icon,
        component: routeMetaConfigMap[menu.id]?.component,
        children: buildMenuItems(menu.children),
      }

      return menuItem
    })
}
