<script setup lang="ts">
import type { MenuItem } from '@admin/pages/home/components/AppSidebarMenu.vue'
import type { HTMLAttributes } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
} from '@admin/components/ui/sidebar'
import AppSidebarMenu from '@admin/pages/home/components/AppSidebarMenu.vue'

const props = defineProps<{
  menus: MenuItem[]
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Sidebar
    class="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    v-bind="props"
  >
    <SidebarContent class="px-2 py-4">
      <SidebarMenu>
        <AppSidebarMenu
          v-for="item in props.menus"
          :key="item.name"
          :item="item"
        />
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
</template>
