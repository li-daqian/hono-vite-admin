<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'
import type { LucideIcon } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@admin/components/ui/collapsible'

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@admin/components/ui/sidebar'
import { ChevronRight } from 'lucide-vue-next'

type MenuItem = AuthMenuSchema & {
  children?: MenuItem[]
  isActive?: boolean
  icon?: LucideIcon
}

const props = defineProps<
  { menus: Array<MenuItem> }
  & { class?: HTMLAttributes['class'] }
>()
</script>

<template>
  <div>
    <Sidebar class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" v-bind="props">
      <SidebarContent class="px-2 py-4">
        <SidebarMenu>
          <Collapsible v-for="item in props.menus" :key="item.name" as-child :default-open="item.isActive">
            <SidebarMenuItem>
              <SidebarMenuButton as-child :tooltip="item.name">
                <a :href="item.path ?? '#'">
                  <!-- <component :is="item.icon" /> -->
                  <span>{{ item.name }}</span>
                </a>
              </SidebarMenuButton>
              <template v-if="item.children?.length">
                <CollapsibleTrigger as-child>
                  <SidebarMenuAction class="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span class="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="subItem in item.children" :key="subItem.name">
                      <SidebarMenuSubButton as-child>
                        <a :href="subItem.path ?? '#'">
                          <span>{{ subItem.name }}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </template>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  </div>
</template>
