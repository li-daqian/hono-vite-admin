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
import { computed, ref, watch } from 'vue'
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

const snapshotText = computed(() => {
  if (!detail.value || detail.value.requestSnapshot == null) {
    return 'No request snapshot recorded.'
  }

  const serialized = JSON.stringify(detail.value.requestSnapshot, null, 2)
  return serialized ?? String(detail.value.requestSnapshot)
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
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
      return
    }

    await fetchAuditLog(id)
  },
  { immediate: true },
)
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

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <template v-if="isLoading">
          <Skeleton class="h-24" />
          <Skeleton class="h-72" />
        </template>

        <template v-else-if="detail">
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

          <div class="min-h-0 flex-1 overflow-hidden">
            <p class="mb-2 text-sm text-muted-foreground">
              Request Snapshot
            </p>
            <pre class="h-full min-h-72 overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-5 whitespace-pre-wrap break-all">{{ snapshotText }}</pre>
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
