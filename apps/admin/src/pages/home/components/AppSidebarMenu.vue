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

type MenuItem = AuthMenuSchema & {
  children?: MenuItem[]
  isActive?: boolean
  icon?: LucideIcon
}

defineProps<{
  item: MenuItem
}>()
</script>

<template>
  <Collapsible as-child :default-open="item.isActive">
    <SidebarMenuItem>
      <!-- Main button -->
      <SidebarMenuButton as-child :tooltip="item.name">
        <a :href="item.path ?? '#'">
          <span>{{ item.name }}</span>
        </a>
      </SidebarMenuButton>

      <!-- Children -->
      <template v-if="item.children?.length">
        <CollapsibleTrigger as-child>
          <SidebarMenuAction class="data-[state=open]:rotate-90">
            <ChevronRight />
            <span class="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem
              v-for="child in item.children"
              :key="child.name"
            >
              <!-- 🔁 Recursive call -->
              <AppSidebarMenu :item="child" />
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </template>
    </SidebarMenuItem>
  </Collapsible>
</template>
