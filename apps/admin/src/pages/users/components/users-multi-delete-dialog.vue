<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { Table } from '@tanstack/vue-table'
import { deleteUserBatch } from '@admin/client'
import ConfirmDialog from '@admin/components/confirm-dialog.vue'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

type User = UserProfileResponseSchema

const props = defineProps<{
  table: Table<User>
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const CONFIRM_WORD = 'DELETE'
const confirmValue = ref('')
const isDeleting = ref(false)

const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)
const selectedUsers = computed(() => selectedRows.value.map(row => row.original))
const canDelete = computed(() => confirmValue.value.trim() === CONFIRM_WORD)

function handleOpenChange(open: boolean) {
  emit('update:open', open)
  if (!open) {
    confirmValue.value = ''
  }
}

async function handleDelete() {
  const count = selectedUsers.value.length
  if (count <= 0) {
    handleOpenChange(false)
    return
  }

  if (!canDelete.value) {
    toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
    return
  }

  isDeleting.value = true
  try {
    const userIds = selectedUsers.value.map(user => user.id)
    await deleteUserBatch<true>({
      body: {
        userIds,
      },
    })

    props.table.resetRowSelection()
    handleOpenChange(false)
    toast.success(`Deleted ${count} user${count > 1 ? 's' : ''}.`)
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
    :disabled="selectedUsers.length === 0 || !canDelete"
    :is-loading="isDeleting"
    confirm-text="Delete"
    destructive
    @update:open="handleOpenChange"
  >
    <template #title>
      <span class="text-destructive">
        <AlertTriangle class="me-1 inline-block stroke-destructive" :size="18" />
        Delete {{ selectedUsers.length }} {{ selectedUsers.length > 1 ? 'Users' : 'User' }}
      </span>
    </template>

    <template #desc>
      <div class="space-y-4 text-sm leading-6">
        <p>
          Are you sure you want to delete the selected users?
          <br>
          This action cannot be undone.
        </p>

        <Label class="my-2 flex flex-col items-start gap-2">
          <span>Confirm by typing "{{ CONFIRM_WORD }}":</span>
          <Input
            v-model="confirmValue"
            :placeholder="`Type ${CONFIRM_WORD} to confirm.`"
          />
        </Label>

        <div class="max-h-44 overflow-auto rounded-md border p-2">
          <p class="mb-2 text-xs text-muted-foreground">
            Users to be deleted:
          </p>
          <ul class="space-y-1 text-sm">
            <li v-for="user in selectedUsers" :key="user.id">
              {{ user.username }}
            </li>
          </ul>
        </div>

        <div class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Warning: Please be careful, this operation cannot be rolled back.
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
