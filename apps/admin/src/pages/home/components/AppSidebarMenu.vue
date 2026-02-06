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
  useSidebar,
} from '@admin/components/ui/sidebar'
import AppSidebarMenuLable from '@admin/pages/home/components/AppSidebarMenuLable.vue'
import { ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

export type MenuItem = Omit<AuthMenuSchema, 'children'> & {
  children?: MenuItem[]
  isActive?: boolean
  icon?: LucideIcon
}

const props = defineProps<{
  menu: MenuItem
}>()

const { state } = useSidebar()

// When collapsed, show parent as active if any child is active
// When expanded, only show parent as active if it's directly active
const isActive = computed(() => {
  if (state.value === 'collapsed') {
    return props.menu.children?.some(child => child.isActive)
  }
  return props.menu.isActive
})
</script>

<template>
  <Collapsible as-child :default-open="menu.children?.find(child => child.isActive) ? true : false">
    <SidebarMenuItem>
      <!-- Main button -->
      <template v-if="menu.path">
        <SidebarMenuButton as-child :tooltip="menu.name" :is-active="menu.isActive">
          <RouterLink :to="menu.path">
            <AppSidebarMenuLable :icon="menu.icon" :label="menu.name" />
          </RouterLink>
        </SidebarMenuButton>
      </template>
      <!-- Children -->
      <template v-if="menu.children?.length">
        <CollapsibleTrigger as-child>
          <SidebarMenuButton :tooltip="menu.name" :is-active="isActive" class="group cursor-pointer">
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
