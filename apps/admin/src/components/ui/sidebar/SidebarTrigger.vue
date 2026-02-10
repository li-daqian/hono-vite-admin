<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@admin/components/ui/button'
import { cn } from '@admin/lib/utils'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  size?: number
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeft :size="props.size" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
