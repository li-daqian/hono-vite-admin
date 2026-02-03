<script setup lang="ts">
import type { MenuProp } from '@admin/pages/home/components/AppSidebarMenu.vue'
import type { HTMLAttributes } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
} from '@admin/components/ui/sidebar'
import { cn } from '@admin/lib/utils'
import AppSidebarMenu from '@admin/pages/home/components/AppSidebarMenu.vue'

const props = defineProps<{
  menus: MenuProp[]
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Sidebar :class="cn(props.class, 'top-(--header-height) h-[calc(100svh-var(--header-height))]!')">
    <SidebarContent class="px-2 py-4">
      <SidebarMenu>
        <AppSidebarMenu
          v-for="item in props.menus"
          :key="item.id"
          :menu="item"
        />
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
</template>
