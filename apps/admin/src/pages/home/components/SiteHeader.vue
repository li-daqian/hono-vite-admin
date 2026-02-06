<script setup lang="ts">
import Logo from '@admin/components/Logo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
import { Button } from '@admin/components/ui/button'
import { SidebarTrigger, useSidebar } from '@admin/components/ui/sidebar'
import UserNav from '@admin/pages/home/components/UserNav.vue'

const { isMobile } = useSidebar()
</script>

<template>
  <div class="flex items-center bg-background h-(--header-height) w-full sticky top-0 z-50 border-b">
    <header class="flex items-center px-4 w-full">
      <a class="flex items-center gap-2 select-none">
        <Logo />
        <span class="text-lg font-semibold">User Admin</span>
        <SidebarTrigger v-if="isMobile" class="ml-auto cursor-pointer" />
      </a>
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
