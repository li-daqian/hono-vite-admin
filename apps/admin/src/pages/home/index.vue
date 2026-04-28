<script setup lang="ts">
import ReadOnlyBanner from '@admin/components/ReadOnlyBanner.vue'
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar'
import AppSidebar from '@admin/pages/home/components/AppSidebar.vue'
import SiteHeader from '@admin/pages/home/components/SiteHeader.vue'
import { usePageRefreshStore } from '@admin/stores/page-refresh'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageRefreshStore = usePageRefreshStore()

const routerViewKey = computed(() => `${route.path}:${pageRefreshStore.refreshCount}`)
</script>

<template>
  <div class="[--header-height:calc(--spacing(14))]">
    <SidebarProvider class="flex flex-col">
      <SiteHeader />
      <ReadOnlyBanner />
      <div class="flex">
        <AppSidebar />
        <SidebarInset class="p-4">
          <RouterView :key="routerViewKey" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
</template>
