<script setup lang="ts">
import type { MenuItem } from '@admin/stores/menu'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@admin/components/ui/collapsible'

import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@admin/components/ui/sidebar'
import AppSidebarMenuLable from '@admin/pages/home/components/AppSidebarMenuLable.vue'
import { ChevronRight } from 'lucide-vue-next'

export type MenuProp = Omit<MenuItem, 'children'> & {
  children?: MenuProp[]
  isActive?: boolean
}

defineProps<{
  menu: MenuProp
}>()
</script>

<template>
  <Collapsible as-child :default-open="menu.isActive">
    <SidebarMenuItem>
      <SidebarMenuButton as-child :tooltip="menu.name">
        <!-- Main button -->
        <template v-if="menu.path">
          <RouterLink :to="menu.path">
            <AppSidebarMenuLable :icon="menu.icon" :label="menu.name" />
          </RouterLink>
        </template>
        <!-- Children -->
        <template v-if="menu.children?.length">
          <CollapsibleTrigger as-child>
            <AppSidebarMenuLable :icon="menu.icon" :label="menu.name" class="cursor-pointer" />
          </CollapsibleTrigger>

          <CollapsibleTrigger as-child>
            <SidebarMenuAction class="data-[state=open]:rotate-90 transition-transform">
              <ChevronRight />
              <span class="sr-only">Toggle</span>
            </SidebarMenuAction>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem
                v-for="child in menu.children"
                :key="child.id"
              >
                <!-- 🔁 Recursive call -->
                <AppSidebarMenu :menu="child" />
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </template>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </Collapsible>
</template>
