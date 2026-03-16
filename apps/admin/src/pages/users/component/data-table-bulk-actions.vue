<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { Table } from '@tanstack/vue-table'
import { DataTableBulkActions as BulkActionsToolbar } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@admin/components/ui/tooltip'
import { Mail, Trash2, UserCheck, UserX } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import UsersMultiDeleteDialog from './users-multi-delete-dialog.vue'

type User = UserProfileResponseSchema

const props = defineProps<{
  table: Table<User>
}>()

const showDeleteConfirm = ref(false)
const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function handleBulkStatusChange(status: 'active' | 'inactive') {
  const selectedUsers = selectedRows.value.map(row => row.original)
  toast.promise(delay(1200), {
    loading: `${status === 'active' ? 'Activating' : 'Deactivating'} users...`,
    success: () => {
      props.table.resetRowSelection()
      return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
    },
    error: `Error ${status === 'active' ? 'activating' : 'deactivating'} users`,
  })
}

function handleBulkInvite() {
  const selectedUsers = selectedRows.value.map(row => row.original)
  toast.promise(delay(1200), {
    loading: 'Inviting users...',
    success: () => {
      props.table.resetRowSelection()
      return `Invited ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
    },
    error: 'Error inviting users',
  })
}
</script>

<template>
  <BulkActionsToolbar :table="props.table" entity-name="user">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Invite selected users"
          title="Invite selected users"
          @click="handleBulkInvite"
        >
          <Mail />
          <span class="sr-only">Invite selected users</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Invite selected users</p>
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Activate selected users"
          title="Activate selected users"
          @click="() => handleBulkStatusChange('active')"
        >
          <UserCheck />
          <span class="sr-only">Activate selected users</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Activate selected users</p>
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Deactivate selected users"
          title="Deactivate selected users"
          @click="() => handleBulkStatusChange('inactive')"
        >
          <UserX />
          <span class="sr-only">Deactivate selected users</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Deactivate selected users</p>
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="destructive"
          size="icon"
          class="size-8"
          aria-label="Delete selected users"
          title="Delete selected users"
          @click="showDeleteConfirm = true"
        >
          <Trash2 />
          <span class="sr-only">Delete selected users</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Delete selected users</p>
      </TooltipContent>
    </Tooltip>
  </BulkActionsToolbar>

  <UsersMultiDeleteDialog
    :table="props.table"
    :open="showDeleteConfirm"
    @update:open="showDeleteConfirm = $event"
  />
</template>
