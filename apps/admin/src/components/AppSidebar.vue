<script setup lang="ts">
import type { AuthMenuSchema } from '@admin/client'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@admin/components/ui/sidebar'
import { useMenuStore } from '@admin/stores/menu'
import { onMounted, ref } from 'vue'

const menus = ref<AuthMenuSchema[]>([])

onMounted(async () => {
  menus.value = useMenuStore().menus
})
</script>

<template>
  <div>
    <Sidebar>
      <SidebarContent class="px-2 py-4">
        <SidebarMenu>
          <template v-for="menu in menus" :key="menu.id">
            <SidebarMenuItem>
              <SidebarMenuButton
                v-if="menu.children.length === 0"
                :as-child="!!menu.path"
                class="cursor-pointer"
              >
                <a v-if="menu.path" :href="menu.path" class="flex items-center gap-2">
                  <span>{{ menu.name }}</span>
                </a>
                <span v-else class="flex items-center gap-2">
                  <span>{{ menu.name }}</span>
                </span>
              </SidebarMenuButton>

              <template v-else>
                <!-- Parent with children - create a collapsible section -->
                <details class="group w-full">
                  <summary class="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer hover:text-sidebar-accent-foreground">
                    <span class="flex-1">{{ menu.name }}</span>
                    <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </summary>

                  <SidebarMenuSub class="ml-2 border-l">
                    <template v-for="child in menu.children" :key="child.id">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          :as-child="!!child.path"
                          class="cursor-pointer"
                        >
                          <RouterLink v-if="child.path" :to="child.path" class="flex items-center gap-2">
                            <span>{{ child.name }}</span>
                          </RouterLink>
                          <span v-else class="flex items-center gap-2">
                            <span>{{ child.name }}</span>
                          </span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </template>
                  </SidebarMenuSub>
                </details>
              </template>
            </SidebarMenuItem>
          </template>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  </div>
</template>
