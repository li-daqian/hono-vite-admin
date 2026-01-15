<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Input } from '@admin/components/ui/input'
import { cn } from '@admin/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Input
    data-slot="input-group-control"
    :class="cn(
      'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent',
      props.class,
    )"
  />
</template>
