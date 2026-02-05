<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'
import type { MenuItem } from '@admin/pages/home/components/AppSidebarMenu.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarRail,
  SidebarTrigger,
} from '@admin/components/ui/sidebar'
import AppSidebarMenu from '@admin/pages/home/components/AppSidebarMenu.vue'
import router from '@admin/router'
import { routeMetaConfigMap } from '@admin/router/route-meta'
import { useMenuStore } from '@admin/stores/menu'
import { computed } from 'vue'

const menuStore = useMenuStore()

function enrichMenusWithIcons(menus: AuthMenuSchema[]): MenuItem[] {
  return menus.map((menu) => {
    const routeMetaConfig = routeMetaConfigMap[menu.id]
    const enrichedMenu: MenuItem = {
      ...menu,
      icon: routeMetaConfig?.icon,
      isActive: router.currentRoute.value.path === menu.path,
      children: enrichMenusWithIcons(menu.children),
    }
    return enrichedMenu
  })
}

const menusWithIcons = computed(() => enrichMenusWithIcons(menuStore.menus))
</script>

<template>
  <Sidebar collapsible="icon" class="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
    <SidebarContent class="px-2 py-4">
      <SidebarMenu>
        <AppSidebarMenu
          v-for="item in menusWithIcons"
          :key="item.id"
          :menu="item"
        />
      </SidebarMenu>
    </SidebarContent>
    <SidebarFooter>
      <SidebarTrigger class="cursor-pointer" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
