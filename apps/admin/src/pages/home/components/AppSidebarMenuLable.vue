<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'
import { cn } from '@admin/lib/utils'

const props = defineProps<{
  icon?: LucideIcon
  label: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex gap-2 items-center', props.class)">
    <component
      :is="props.icon"
      v-if="props.icon"
      class="h-4 w-4 shrink-0"
    />
    <span class="font-lg">{{ props.label }}</span>
  </div>
</template>
