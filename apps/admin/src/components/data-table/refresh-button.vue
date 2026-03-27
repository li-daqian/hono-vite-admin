<script setup lang="ts">
import { Button } from '@admin/components/ui/button'
import { RefreshCw } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  loading?: boolean
  ariaLabel?: string
}>(), {
  loading: false,
  ariaLabel: 'Refresh table',
})

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <Button
    variant="outline"
    size="icon-sm"
    :disabled="props.loading"
    :aria-label="props.ariaLabel"
    :title="props.ariaLabel"
    @click="emit('refresh')"
  >
    <RefreshCw class="size-4" :class="[props.loading ? 'animate-spin' : '']" />
  </Button>
</template>
