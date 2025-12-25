<script setup lang="ts">
import Logo from '@admin/components/Logo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
import Avatar from '@admin/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@admin/components/ui/avatar/AvatarFallback.vue'
import AvatarImage from '@admin/components/ui/avatar/AvatarImage.vue'
import Button from '@admin/components/ui/button/Button.vue'
</script>

<template>
  <div>
    <header class="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <a class="flex items-center gap-2 select-none">
        <Logo />
        <span class="text-lg font-semibold">User Admin</span>
      </a>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="rounded-full cursor-pointer">
          <ToggleTheme />
        </Button>
        <Button variant="ghost" size="icon-lg" class="rounded-full cursor-pointer">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  </div>
</template>
