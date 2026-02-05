<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'

import type { LucideIcon } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@admin/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@admin/components/ui/sidebar'
import AppSidebarMenuLable from '@admin/pages/home/components/AppSidebarMenuLable.vue'
import { ChevronRight } from 'lucide-vue-next'

export type MenuItem = Omit<AuthMenuSchema, 'children'> & {
  children?: MenuItem[]
  isActive?: boolean
  icon?: LucideIcon
}

defineProps<{
  menu: MenuItem
}>()
</script>

<template>
  <Collapsible as-child :default-open="menu.isActive">
    <SidebarMenuItem>
      <!-- Main button -->
      <template v-if="menu.path">
        <SidebarMenuButton as-child :tooltip="menu.name">
          <RouterLink :to="menu.path">
            <AppSidebarMenuLable :icon="menu.icon" :label="menu.name" />
          </RouterLink>
        </SidebarMenuButton>
      </template>
      <!-- Children -->
      <template v-if="menu.children?.length">
        <CollapsibleTrigger as-child>
          <SidebarMenuButton :tooltip="menu.name" class="group cursor-pointer">
            <AppSidebarMenuLable :icon="menu.icon" :label="menu.name" />
            <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </SidebarMenuButton>
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
    </SidebarMenuItem>
  </Collapsible>
</template>
