<script lang="ts" setup>
import ThemeToggle from '@admin/components/ThemeToggle.vue'
</script>

<template>
  <div id="globalHeader" class="px-4 h-12 leading-12">
    <div class="flex items-center">
      <div class="flex items-center">
        <img src="@admin/assets/vite.svg" alt="Logo" class="h-8 w-8">
        <span class="ml-2 font-bold text-lg">Admin</span>
      </div>
      <div class="flex items-center ml-auto gap-4">
        <div class="ml-4">
          <ThemeToggle />
        </div>
        <div>
          User Menu
        </div>
      </div>
    </div>
  </div>
</template>
