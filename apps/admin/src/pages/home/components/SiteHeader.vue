<script setup lang="ts">
import AppLogo from '@admin/components/AppLogo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
import { Button } from '@admin/components/ui/button'
import { SidebarTrigger } from '@admin/components/ui/sidebar'
import { SIDEBAR_WIDTH } from '@admin/components/ui/sidebar/utils'
import { cn } from '@admin/lib/utils'
import UserNav from '@admin/pages/home/components/UserNav.vue'
</script>

<template>
  <div class="flex items-center bg-background h-(--header-height) w-full sticky top-0 z-50 border-b">
    <div :class="cn('shrink-0', `w-[${SIDEBAR_WIDTH}]`)">
      <a class="flex items-center gap-4 px-4">
        <SidebarTrigger :size="18" class="rounded-lg cursor-pointer" />
        <div class="flex items-center justify-center gap-2">
          <AppLogo class="size-6" />
          <span class="text-lg font-semibold">User Admin</span>
        </div>
      </a>
    </div>
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
