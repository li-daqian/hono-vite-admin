<script setup lang="ts">
import type { PermissionSummary } from '@admin/components/ui/permission-tree/model'
import { Badge } from '@admin/components/ui/badge'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  added: PermissionSummary[]
  removed?: PermissionSummary[]
  emptyMessage?: string
  maxItems?: number
}>(), {
  removed: () => [],
  emptyMessage: 'No permission changes.',
  maxItems: 6,
})

const visibleAdded = computed(() => props.added.slice(0, props.maxItems))
const visibleRemoved = computed(() => props.removed.slice(0, props.maxItems))
const hiddenAddedCount = computed(() => Math.max(props.added.length - props.maxItems, 0))
const hiddenRemovedCount = computed(() => Math.max(props.removed.length - props.maxItems, 0))
const hasChanges = computed(() => props.added.length > 0 || props.removed.length > 0)

function formatPath(summary: PermissionSummary) {
  return summary.path.join(' / ')
}
</script>

<template>
  <div class="rounded-md border bg-muted/20 p-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="text-sm font-medium">
        Difference Preview
      </h3>
      <div class="flex shrink-0 items-center gap-1">
        <Badge variant="outline" class="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
          +{{ props.added.length }}
        </Badge>
        <Badge variant="outline" class="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          -{{ props.removed.length }}
        </Badge>
      </div>
    </div>

    <p v-if="!hasChanges" class="text-sm text-muted-foreground">
      {{ props.emptyMessage }}
    </p>

    <div v-else class="space-y-3">
      <div v-if="visibleAdded.length" class="space-y-1.5">
        <p class="text-xs font-medium uppercase text-green-700 dark:text-green-300">
          Added
        </p>
        <div class="space-y-1">
          <div
            v-for="summary in visibleAdded"
            :key="summary.key"
            class="min-w-0 rounded-sm bg-background px-2 py-1.5"
          >
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="shrink-0 text-[10px]">
                {{ summary.type }}
              </Badge>
              <span class="truncate text-sm">{{ formatPath(summary) }}</span>
            </div>
          </div>
          <p v-if="hiddenAddedCount" class="text-xs text-muted-foreground">
            +{{ hiddenAddedCount }} more
          </p>
        </div>
      </div>

      <div v-if="visibleRemoved.length" class="space-y-1.5">
        <p class="text-xs font-medium uppercase text-red-700 dark:text-red-300">
          Removed
        </p>
        <div class="space-y-1">
          <div
            v-for="summary in visibleRemoved"
            :key="summary.key"
            class="min-w-0 rounded-sm bg-background px-2 py-1.5"
          >
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="shrink-0 text-[10px]">
                {{ summary.type }}
              </Badge>
              <span class="truncate text-sm">{{ formatPath(summary) }}</span>
            </div>
          </div>
          <p v-if="hiddenRemovedCount" class="text-xs text-muted-foreground">
            +{{ hiddenRemovedCount }} more
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
