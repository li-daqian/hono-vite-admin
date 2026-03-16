<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { Table } from '@tanstack/vue-table'
import ConfirmDialog from '@admin/components/confirm-dialog.vue'
import { computed } from 'vue'
import { toast } from 'vue-sonner'

type User = UserProfileResponseSchema

const props = defineProps<{
  table: Table<User>
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)
const selectedUsers = computed(() => selectedRows.value.map(row => row.original))

function handleOpenChange(open: boolean) {
  emit('update:open', open)
}

function handleDelete() {
  const count = selectedUsers.value.length
  if (count <= 0) {
    handleOpenChange(false)
    return
  }

  props.table.resetRowSelection()
  handleOpenChange(false)
  toast.success(`Deleted ${count} user${count > 1 ? 's' : ''} (mock action).`)
}
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :handle-confirm="handleDelete"
    :disabled="selectedUsers.length === 0"
    confirm-text="Delete"
    destructive
    @update:open="handleOpenChange"
  >
    <template #title>
      <span class="text-destructive">Delete Selected Users</span>
    </template>

    <template #desc>
      <div class="space-y-3 text-sm leading-6">
        <p>
          You are about to delete
          <span class="font-bold">{{ selectedUsers.length }}</span>
          selected user{{ selectedUsers.length > 1 ? 's' : '' }}.
          This action cannot be undone.
        </p>

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
      </div>
    </template>
  </ConfirmDialog>
</template>
