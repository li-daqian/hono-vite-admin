<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import { deleteUserBatch } from '@admin/client'
import ConfirmDialog from '@admin/components/confirm-dialog.vue'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

type User = UserProfileResponseSchema

const props = defineProps<{
  open: boolean
  currentRow: User
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const value = ref('')
const isDeleting = ref(false)

const canDelete = computed(() => value.value.trim() === props.currentRow.username)

function handleOpenChange(open: boolean) {
  emit('update:open', open)
  if (!open)
    value.value = ''
}

async function handleDelete() {
  if (!canDelete.value)
    return

  isDeleting.value = true
  try {
    await deleteUserBatch<true>({
      body: {
        userIds: [props.currentRow.id],
      },
    })

    handleOpenChange(false)
    toast.success(`User "${props.currentRow.username}" deleted.`)
    emit('success')
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :handle-confirm="handleDelete"
    :disabled="!canDelete"
    :is-loading="isDeleting"
    confirm-text="Delete"
    destructive
    @update:open="handleOpenChange"
  >
    <template #title>
      <span class="text-destructive">
        <AlertTriangle class="me-1 inline-block stroke-destructive" :size="18" />
        Delete User
      </span>
    </template>

    <template #desc>
      <div class="space-y-4">
        <p class="mb-2 text-sm leading-6">
          Are you sure you want to delete
          <span class="font-bold">{{ props.currentRow.username }}</span>?
          <br>
          This action will permanently remove this user from the system. This cannot be undone.
        </p>

        <Label class="my-2 flex-col items-start gap-2">
          Username:
          <Input
            v-model="value"
            placeholder="Enter username to confirm deletion."
          />
        </Label>

        <div class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Warning: Please be careful, this operation cannot be rolled back.
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
