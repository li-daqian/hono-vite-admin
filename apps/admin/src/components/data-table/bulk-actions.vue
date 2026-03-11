<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import { Separator } from '@admin/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@admin/components/ui/tooltip'
import { cn } from '@admin/lib/utils'
import { X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  table: Table<TData>
  entityName: string
}>()

const toolbarRef = ref<HTMLDivElement | null>(null)
const announcement = ref('')
let announcementTimer: number | undefined

const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)
const selectedCount = computed(() => selectedRows.value.length)

const entityLabel = computed(() => {
  return `${props.entityName}${selectedCount.value > 1 ? 's' : ''}`
})

watch([selectedCount, () => props.entityName], ([count]) => {
  if (announcementTimer) {
    window.clearTimeout(announcementTimer)
    announcementTimer = undefined
  }

  if (count <= 0) {
    announcement.value = ''
    return
  }

  const message = `${count} ${props.entityName}${count > 1 ? 's' : ''} selected. Bulk actions toolbar is available.`

  // Defer state update to avoid chained renders while table state is changing.
  queueMicrotask(() => {
    announcement.value = message
  })

  announcementTimer = window.setTimeout(() => {
    announcement.value = ''
  }, 3000)
}, { immediate: true })

onBeforeUnmount(() => {
  if (announcementTimer) {
    window.clearTimeout(announcementTimer)
  }
})

function handleClearSelection() {
  props.table.resetRowSelection()
}

function handleKeyDown(event: KeyboardEvent) {
  const buttons = toolbarRef.value?.querySelectorAll('button')
  if (!buttons || buttons.length === 0)
    return

  const currentIndex = Array.from(buttons).findIndex(
    button => button === document.activeElement,
  )

  switch (event.key) {
    case 'ArrowRight': {
      event.preventDefault()
      const nextIndex = (currentIndex + 1) % buttons.length
      buttons[nextIndex]?.focus()
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1
      buttons[prevIndex]?.focus()
      break
    }
    case 'Home':
      event.preventDefault()
      buttons[0]?.focus()
      break
    case 'End':
      event.preventDefault()
      buttons[buttons.length - 1]?.focus()
      break
    case 'Escape': {
      const target = event.target as HTMLElement | null
      const activeElement = document.activeElement as HTMLElement | null

      const isFromDropdownTrigger
        = target?.getAttribute('data-slot') === 'dropdown-menu-trigger'
          || activeElement?.getAttribute('data-slot') === 'dropdown-menu-trigger'
          || Boolean(target?.closest('[data-slot="dropdown-menu-trigger"]'))
          || Boolean(activeElement?.closest('[data-slot="dropdown-menu-trigger"]'))

      const isFromDropdownContent
        = Boolean(activeElement?.closest('[data-slot="dropdown-menu-content"]'))
          || Boolean(target?.closest('[data-slot="dropdown-menu-content"]'))

      if (isFromDropdownTrigger || isFromDropdownContent) {
        return
      }

      event.preventDefault()
      handleClearSelection()
      break
    }
  }
}
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
    role="status"
  >
    {{ announcement }}
  </div>

  <div
    v-if="selectedCount > 0"
    ref="toolbarRef"
    role="toolbar"
    :aria-label="`Bulk actions for ${selectedCount} selected ${entityLabel}`"
    aria-describedby="bulk-actions-description"
    tabindex="-1"
    :class="cn(
      'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl',
      'transition-all delay-100 duration-300 ease-out hover:scale-105',
      'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
    )"
    @keydown="handleKeyDown"
  >
    <div
      :class="cn(
        'flex items-center gap-x-2 rounded-xl border p-2 shadow-xl',
        'bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/60',
      )"
    >
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            size="icon"
            class="size-6 rounded-full"
            aria-label="Clear selection"
            title="Clear selection (Escape)"
            @click="handleClearSelection"
          >
            <X />
            <span class="sr-only">Clear selection</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear selection (Escape)</p>
        </TooltipContent>
      </Tooltip>

      <Separator
        class="h-5"
        orientation="vertical"
        aria-hidden="true"
      />

      <div
        id="bulk-actions-description"
        class="flex items-center gap-x-1 text-sm"
      >
        <Badge
          variant="default"
          class="min-w-8 rounded-lg"
          :aria-label="`${selectedCount} selected`"
        >
          {{ selectedCount }}
        </Badge>
        <span class="hidden sm:inline">{{ entityLabel }}</span>
        selected
      </div>

      <Separator
        class="h-5"
        orientation="vertical"
        aria-hidden="true"
      />

      <slot />
    </div>
  </div>
</template>
