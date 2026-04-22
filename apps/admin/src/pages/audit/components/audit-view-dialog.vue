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

const hasRequestSnapshot = computed(() => detail.value?.requestSnapshot != null)

const snapshotText = computed(() => {
  if (!detail.value || detail.value.requestSnapshot == null) {
    return 'No request snapshot recorded.'
  }

  const serialized = JSON.stringify(detail.value.requestSnapshot, null, 2)
  return serialized ?? String(detail.value.requestSnapshot)
})

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
