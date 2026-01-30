<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
import AppSidebar from '@admin/pages/home/components/AppSidebar.vue'
import SiteHeader from '@admin/pages/home/components/SiteHeader.vue'
import { useMenuStore } from '@admin/stores/menu'
import { storeToRefs } from 'pinia'

const menuStore = useMenuStore()
const { menus } = storeToRefs(menuStore)
</script>

<template>
  <div class="[--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
      <div class="flex flex-1">
        <AppSidebar :menus="menus" />
        <SidebarInset>
          <RouterView />
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>
