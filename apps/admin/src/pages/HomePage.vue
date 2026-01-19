<script setup lang="ts">
import SiteHeader from '@admin/components/SiteHeader.vue'
import { SidebarProvider } from '@admin/components/ui/sidebar'
</script>

<template>
  <div class="[--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
    </SidebarProvider>
  </div>
</template>
