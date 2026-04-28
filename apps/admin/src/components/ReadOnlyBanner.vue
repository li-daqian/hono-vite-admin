<script setup lang="ts">
import { useAppConfigStore } from '@admin/stores/app-config'
import { Info } from 'lucide-vue-next'

const appConfigStore = useAppConfigStore()
</script>

<template>
  <div
    v-if="appConfigStore.readOnlyMode"
    class="border-b border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
  >
    <div class="flex min-h-10 items-center gap-2 px-4 text-sm">
      <Info class="size-4 shrink-0" />
      <span class="font-medium">{{ appConfigStore.readOnlyMessage }}</span>
      <span class="text-amber-800 dark:text-amber-200">
        Changes are disabled in this deployment.
      </span>
    </div>
  </div>
</template>
