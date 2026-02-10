<script setup lang="ts">
import Logo from '@admin/components/Logo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
import { Button } from '@admin/components/ui/button'
import { SidebarTrigger, useSidebar } from '@admin/components/ui/sidebar'
import { SIDEBAR_WIDTH } from '@admin/components/ui/sidebar/utils'
import UserNav from '@admin/pages/home/components/UserNav.vue'
import { computed } from 'vue'

const { isMobile } = useSidebar()
const logoAreaWidth = computed(() => {
  if (isMobile.value) {
    return ''
  }
  return `w-[${SIDEBAR_WIDTH}]`
})
</script>

<template>
  <div class="flex items-center bg-background h-(--header-height) w-full sticky top-0 z-50 border-b">
    <header class="flex items-center px-4 w-full">
      <div :class="`${logoAreaWidth}`">
        <a class="flex items-center gap-2 select-none">
          <Logo />
          <span class="text-lg font-semibold">User Admin</span>
        </a>
      </div>
      <div>
        <SidebarTrigger :size="18" class="rounded-lg cursor-pointer size-8" />
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" class="rounded-full cursor-pointer">
          <ToggleTheme class="text-lg" />
        </Button>
        <Button variant="ghost" size="icon-lg" class="rounded-full cursor-pointer">
          <UserNav />
        </Button>
      </div>
    </header>
  </div>
</template>
