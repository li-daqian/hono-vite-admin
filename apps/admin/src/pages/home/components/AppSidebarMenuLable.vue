<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  icon?: LucideIcon
  label: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="props.class">
    <component
      :is="props.icon"
      v-if="props.icon"
      class="h-4 w-4 shrink-0"
    />
    <span>{{ props.label }}</span>
  </div>
</template>
