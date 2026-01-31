<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'
import type { LucideIcon } from 'lucide-vue-next'

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

import { ChevronRight } from 'lucide-vue-next'

export type MenuItem = AuthMenuSchema & {
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
      <SidebarMenuButton as-child :tooltip="menu.name">
        <a :href="menu.path ?? '#'">
          <span>{{ menu.name }}</span>
        </a>
      </SidebarMenuButton>

      <!-- Children -->
      <template v-if="menu.children?.length">
        <CollapsibleTrigger as-child>
          <SidebarMenuAction class="data-[state=open]:rotate-90">
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
    </SidebarMenuItem>
  </Collapsible>
</template>
