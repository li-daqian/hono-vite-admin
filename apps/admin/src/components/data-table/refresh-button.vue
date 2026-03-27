<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@admin/components/ui/button'
import { cn } from '@admin/lib/utils'
import { RefreshCw } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  loading?: boolean
  ariaLabel?: string
  size?: number
  class?: HTMLAttributes['class']
}>(), {
  loading: false,
  ariaLabel: 'Refresh table',
  size: 18,
})

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :disabled="props.loading"
    :aria-label="props.ariaLabel"
    :title="props.ariaLabel"
    :class="cn('h-7 w-7', props.class)"
    @click="emit('refresh')"
  >
    <RefreshCw :class="[props.loading ? 'animate-spin' : '']" :size="props.size" />
  </Button>
</template>
