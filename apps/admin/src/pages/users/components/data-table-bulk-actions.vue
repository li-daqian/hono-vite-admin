<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { Table } from '@tanstack/vue-table'
import { patchUserStatusBatch } from '@admin/client'
import { DataTableBulkActions as BulkActionsToolbar } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@admin/components/ui/tooltip'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { Trash2, UserCheck, UserX } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import UsersMultiDeleteDialog from './users-multi-delete-dialog.vue'

type User = UserProfileResponseSchema

const props = defineProps<{
  table: Table<User>
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const showDeleteConfirm = ref(false)
const isStatusUpdating = ref(false)
const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)
const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { subject: 'users' }))
const deletePermission = computed(() => permissions.resolve('delete', { subject: 'users' }))

async function handleBulkStatusChange(status: 'ACTIVE' | 'DISABLED') {
  const selectedUsers = selectedRows.value.map(row => row.original)
  const userIds = selectedUsers.map(user => user.id)
  if (userIds.length === 0)
    return

  isStatusUpdating.value = true
  try {
    await patchUserStatusBatch<true>({
      body: {
        userIds,
        status,
      },
    })

    props.table.resetRowSelection()
    emit('success')
    toast.success(
      `${status === 'ACTIVE' ? 'Activated' : 'Deactivated'} ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
    )
  }
  finally {
    isStatusUpdating.value = false
  }
}

function handleDeleteSuccess() {
  showDeleteConfirm.value = false
  emit('success')
}
</script>

<template>
  <BulkActionsToolbar :table="props.table" entity-name="user">
    <Tooltip>
      <TooltipTrigger as-child>
        <span class="inline-flex">
          <Button
            variant="outline"
            size="icon"
            class="size-8"
            :disabled="isStatusUpdating || !editPermission.allowed"
            aria-label="Activate selected users"
            title="Activate selected users"
            @click="() => handleBulkStatusChange('ACTIVE')"
          >
            <UserCheck />
            <span class="sr-only">Activate selected users</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ editPermission.reason ?? 'Activate selected users' }}</p>
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <span class="inline-flex">
          <Button
            variant="outline"
            size="icon"
            class="size-8"
            :disabled="isStatusUpdating || !editPermission.allowed"
            aria-label="Deactivate selected users"
            title="Deactivate selected users"
            @click="() => handleBulkStatusChange('DISABLED')"
          >
            <UserX />
            <span class="sr-only">Deactivate selected users</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ editPermission.reason ?? 'Deactivate selected users' }}</p>
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <span class="inline-flex">
          <Button
            variant="destructive"
            size="icon"
            class="size-8"
            :disabled="isStatusUpdating || !deletePermission.allowed"
            aria-label="Delete selected users"
            title="Delete selected users"
            @click="showDeleteConfirm = true"
          >
            <Trash2 />
            <span class="sr-only">Delete selected users</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ deletePermission.reason ?? 'Delete selected users' }}</p>
      </TooltipContent>
    </Tooltip>
  </BulkActionsToolbar>

  <UsersMultiDeleteDialog
    :table="props.table"
    :open="showDeleteConfirm"
    @success="handleDeleteSuccess"
    @update:open="showDeleteConfirm = $event"
  />
</template>
