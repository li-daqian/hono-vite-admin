<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
import AppSidebar from '@admin/pages/home/components/AppSidebar.vue'
import SiteHeader from '@admin/pages/home/components/SiteHeader.vue'
</script>

<template>
  <div class="[--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
      <AppSidebar />
      <SidebarInset>
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
  </div>
</template>
