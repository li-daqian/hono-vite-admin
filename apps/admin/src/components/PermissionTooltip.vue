<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@admin/components/ui/tooltip'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  message?: string | null
  wrapperClass?: string
}>(), {
  message: null,
  wrapperClass: 'inline-flex',
})

const hasMessage = computed(() => Boolean(props.message?.trim()))
</script>

<template>
  <Tooltip v-if="hasMessage">
    <TooltipTrigger as-child>
      <span :class="props.wrapperClass">
        <slot />
      </span>
    </TooltipTrigger>
    <TooltipContent>
      <p>{{ props.message }}</p>
    </TooltipContent>
  </Tooltip>
  <slot v-else />
</template>
