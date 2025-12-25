<script setup lang="ts">
import Logo from '@admin/components/Logo.vue'
import ToggleTheme from '@admin/components/ToggleTheme.vue'
</script>

<template>
  <div>
    <header class="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <a class="flex items-center gap-2 select-none">
        <Logo />
        <span class="text-lg font-semibold">User Admin</span>
      </a>
      <div class="flex items-center gap-2 text-lg cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
        <ToggleTheme />
      </div>
    </header>
  </div>
</template>
