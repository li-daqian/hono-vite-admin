<script setup lang="ts">
import type { AuditLogDetailResponseSchema } from '@admin/client'
import { getAuditById } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'
import { Skeleton } from '@admin/components/ui/skeleton'
import { Check, Copy } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { formatAuditDateTime, formatAuditLabel, formatAuditOperator } from './audit-utils'

const props = defineProps<{
  open: boolean
  id?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const detail = ref<AuditLogDetailResponseSchema | null>(null)
const isLoading = ref(false)
const isSnapshotCopied = ref(false)
let resetCopyIndicatorTimer: ReturnType<typeof setTimeout> | null = null

interface AuditDiffRow {
  field: string
  previous: unknown
  next: unknown
  kind: 'added' | 'changed' | 'removed'
}

const hasRequestSnapshot = computed(() => detail.value?.requestSnapshot != null)

const snapshotText = computed(() => {
  if (!detail.value || detail.value.requestSnapshot == null) {
    return 'No request snapshot recorded.'
  }

  const serialized = JSON.stringify(detail.value.requestSnapshot, null, 2)
  return serialized ?? String(detail.value.requestSnapshot)
})

const diffRows = computed(() => buildAuditDiff(detail.value?.requestSnapshot))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyComparable(value: unknown): string {
  return JSON.stringify(value) ?? String(value)
}

function flattenRecord(value: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {}

  for (const [key, nestedValue] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (isRecord(nestedValue)) {
      Object.assign(flattened, flattenRecord(nestedValue, path))
    }
    else {
      flattened[path] = nestedValue
    }
  }

  return flattened
}

function normalizeArrayForDiff(value: unknown[]): Record<string, unknown> | null {
  const normalized: Record<string, unknown> = {}

  for (const item of value) {
    if (!isRecord(item)) {
      return null
    }

    const key = typeof item.key === 'string'
      ? item.key
      : typeof item.id === 'string'
        ? item.id
        : null

    if (!key) {
      return null
    }

    normalized[key] = Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : item
  }

  return normalized
}

function normalizeDiffValue(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return normalizeArrayForDiff(value) ?? { value }
  }

  if (isRecord(value)) {
    return flattenRecord(value)
  }

  return { value }
}

function buildAuditDiff(snapshot: unknown): AuditDiffRow[] {
  if (!isRecord(snapshot) || !('previous' in snapshot) || !('next' in snapshot)) {
    return []
  }

  const previous = normalizeDiffValue(snapshot.previous)
  const next = normalizeDiffValue(snapshot.next)
  const fields = [...new Set([...Object.keys(previous), ...Object.keys(next)])].sort()

  return fields
    .filter(field => stringifyComparable(previous[field]) !== stringifyComparable(next[field]))
    .map((field) => {
      const hasPrevious = Object.prototype.hasOwnProperty.call(previous, field)
      const hasNext = Object.prototype.hasOwnProperty.call(next, field)

      return {
        field,
        previous: previous[field],
        next: next[field],
        kind: hasPrevious && hasNext ? 'changed' : hasNext ? 'added' : 'removed',
      }
    })
}

function formatDiffValue(value: unknown): string {
  if (value === undefined) {
    return '—'
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value || '""'
  }

  return JSON.stringify(value, null, 2) ?? String(value)
}

function clearCopyIndicatorTimer() {
  if (resetCopyIndicatorTimer) {
    clearTimeout(resetCopyIndicatorTimer)
    resetCopyIndicatorTimer = null
  }
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function handleCopySnapshot() {
  if (!hasRequestSnapshot.value) {
    toast.error('No request snapshot recorded.')
    return
  }

  try {
    await navigator.clipboard.writeText(snapshotText.value)
    isSnapshotCopied.value = true
    clearCopyIndicatorTimer()
    resetCopyIndicatorTimer = setTimeout(() => {
      isSnapshotCopied.value = false
      resetCopyIndicatorTimer = null
    }, 2000)
    toast.success('Request snapshot copied.')
  }
  catch {
    toast.error('Failed to copy request snapshot.')
  }
}

async function fetchAuditLog(id: string) {
  isLoading.value = true

  try {
    const response = await getAuditById<true>({
      path: { id },
    })
    detail.value = response.data
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => [props.open, props.id] as const,
  async ([open, id]) => {
    if (!open || !id) {
      detail.value = null
      isSnapshotCopied.value = false
      clearCopyIndicatorTimer()
      return
    }

    isSnapshotCopied.value = false
    clearCopyIndicatorTimer()
    await fetchAuditLog(id)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearCopyIndicatorTimer()
})
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>Audit Log Detail</DialogTitle>
        <DialogDescription>
          Review the recorded request metadata and redacted request snapshot.
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <template v-if="isLoading">
          <div class="space-y-4">
            <Skeleton class="h-24" />
            <Skeleton class="h-72" />
          </div>
        </template>

        <template v-else-if="detail">
          <div class="flex-1 space-y-4 overflow-y-auto pr-1">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Time
                </p>
                <p class="font-medium">
                  {{ formatAuditDateTime(detail.createdAt) }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Operator
                </p>
                <p class="font-medium">
                  {{ formatAuditOperator(detail) }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Category
                </p>
                <Badge variant="outline">
                  {{ formatAuditLabel(detail.category) }}
                </Badge>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Module
                </p>
                <Badge variant="outline">
                  {{ formatAuditLabel(detail.module) }}
                </Badge>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Action
                </p>
                <p class="font-medium">
                  {{ formatAuditLabel(detail.action) }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Result
                </p>
                <Badge
                  variant="outline"
                  :class="detail.result === 'failure'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                    : detail.result === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : undefined"
                >
                  {{ detail.result ? formatAuditLabel(detail.result) : '—' }}
                </Badge>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Failure Reason
                </p>
                <p class="font-mono text-sm">
                  {{ detail.failureReason ? formatAuditLabel(detail.failureReason) : '—' }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Path
                </p>
                <p class="font-mono text-sm break-all">
                  {{ detail.method }} {{ detail.path }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  Request ID
                </p>
                <p class="font-mono text-sm break-all">
                  {{ detail.requestId }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  IP
                </p>
                <p class="font-mono text-sm">
                  {{ detail.ip ?? '—' }}
                </p>
              </div>

              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">
                  User Agent
                </p>
                <p class="text-sm break-all">
                  {{ detail.userAgent ?? '—' }}
                </p>
              </div>
            </div>

            <div v-if="diffRows.length > 0" class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Diff
              </p>
              <div class="overflow-hidden rounded-md border">
                <div class="grid grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] bg-muted/60 text-xs font-medium text-muted-foreground">
                  <div class="px-3 py-2">
                    Field
                  </div>
                  <div class="px-3 py-2">
                    Before
                  </div>
                  <div class="px-3 py-2">
                    After
                  </div>
                </div>

                <div
                  v-for="row in diffRows"
                  :key="row.field"
                  class="grid grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] border-t text-xs"
                >
                  <div class="space-y-1 px-3 py-2">
                    <p class="font-mono font-medium break-all">
                      {{ row.field }}
                    </p>
                    <Badge variant="outline" class="rounded-sm px-1.5 py-0 text-[10px]">
                      {{ formatAuditLabel(row.kind) }}
                    </Badge>
                  </div>
                  <pre class="min-h-10 overflow-auto px-3 py-2 font-mono leading-5 whitespace-pre-wrap break-all text-muted-foreground">{{ formatDiffValue(row.previous) }}</pre>
                  <pre class="min-h-10 overflow-auto px-3 py-2 font-mono leading-5 whitespace-pre-wrap break-all">{{ formatDiffValue(row.next) }}</pre>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Request Snapshot
              </p>
              <div class="relative overflow-hidden rounded-md border bg-muted/40">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :disabled="!hasRequestSnapshot"
                  :title="isSnapshotCopied ? 'Copied' : 'Copy request snapshot'"
                  class="absolute top-3 right-3 z-10 size-8 rounded-md border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-background hover:text-foreground"
                  @click="handleCopySnapshot"
                >
                  <Check v-if="isSnapshotCopied" class="size-4 text-emerald-500" />
                  <Copy v-else class="size-4" />
                  <span class="sr-only">{{ isSnapshotCopied ? 'Copied' : 'Copy request snapshot' }}</span>
                </Button>
                <pre class="max-h-80 overflow-auto p-4 pr-14 font-mono text-xs leading-5 whitespace-pre-wrap break-all">{{ snapshotText }}</pre>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-muted-foreground">
            Audit log detail is unavailable.
          </p>
        </template>
      </div>

      <DialogFooter class="shrink-0">
        <Button variant="outline" @click="handleOpenChange(false)">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
