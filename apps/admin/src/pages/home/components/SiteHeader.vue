<script setup lang="ts">
import AppLogo from '@admin/components/AppLogo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
import { Button } from '@admin/components/ui/button'
import { SidebarTrigger } from '@admin/components/ui/sidebar'
import { SIDEBAR_WIDTH } from '@admin/components/ui/sidebar/utils'
import AppBreadcrumb from '@admin/pages/home/components/AppBreadcrumb.vue'
import UserNav from '@admin/pages/home/components/UserNav.vue'
import { useMenuStore } from '@admin/stores/menu'
import { computed } from 'vue'

const menuStore = useMenuStore()

const breadcrumb = computed(() => {
  return menuStore.breadcrumb
})
</script>

<template>
  <div class="flex items-center bg-background h-(--header-height) w-full sticky top-0 z-50 border-b shrink-0 text-nowrap">
    <div :style="{ width: SIDEBAR_WIDTH }" class="flex shrink-0 items-center gap-4 px-4">
      <SidebarTrigger :size="18" class="rounded-lg cursor-pointer" />
      <div class="flex items-center justify-center gap-2">
        <AppLogo class="size-6" />
        <span class="text-lg font-semibold">User Admin</span>
      </div>
    </div>
    <AppBreadcrumb :items="breadcrumb" class="px-4" />
    <div class="flex items-center gap-2 ml-auto px-4">
      <Button variant="ghost" size="icon" class="rounded-full cursor-pointer">
        <ToggleTheme class="text-lg" />
      </Button>
      <Button variant="ghost" size="icon-lg" class="rounded-full cursor-pointer">
        <UserNav />
      </Button>
    </div>
  </div>
</template>
