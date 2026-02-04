<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'
import type { MenuProp } from '@admin/pages/home/components/AppSidebarMenu.vue'
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
import AppSidebar from '@admin/pages/home/components/AppSidebar.vue'
import SiteHeader from '@admin/pages/home/components/SiteHeader.vue'
import { routeMetaConfigMap } from '@admin/router/route-meta'
import { useMenuStore } from '@admin/stores/menu'
import { computed } from 'vue'

const menuStore = useMenuStore()

function enrichMenusWithIcons(menus: AuthMenuSchema[]): MenuProp[] {
  return menus.map((menu) => {
    const routeMetaConfig = routeMetaConfigMap[menu.id]
    const enrichedMenu: MenuProp = {
      ...menu,
      icon: routeMetaConfig?.icon,
      children: enrichMenusWithIcons(menu.children),
    }
    return enrichedMenu
  })
}

const menusWithIcons = computed(() => enrichMenusWithIcons(menuStore.menus))
</script>

<template>
  <div class="[--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
      <div class="flex flex-1">
        <AppSidebar :menus="menusWithIcons" />
        <SidebarInset>
          <RouterView />
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>
