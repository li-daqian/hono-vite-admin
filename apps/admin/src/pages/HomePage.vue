<script setup lang="ts">
import AppSidebar from '@admin/components/AppSidebar.vue'
import SiteHeader from '@admin/components/SiteHeader.vue'
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
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
