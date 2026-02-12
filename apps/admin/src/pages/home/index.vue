<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
import AppSidebar from '@admin/pages/home/components/AppSidebar.vue'
import SiteHeader from '@admin/pages/home/components/SiteHeader.vue'
</script>

<template>
  <div class="[--header-height:calc(--spacing(12))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
      <div class="flex">
        <AppSidebar />
        <SidebarInset class="p-4">
          <RouterView />
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>
