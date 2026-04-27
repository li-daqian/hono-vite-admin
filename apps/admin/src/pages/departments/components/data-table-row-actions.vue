<script setup lang="ts">
import type { DepartmentTableRow } from './department-utils'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { Ellipsis, Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'
import { useDepartments } from './departments-provider.vue'

const props = defineProps<{
  row: DepartmentTableRow
}>()

const { setOpen, setCurrentRow } = useDepartments()
const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { subject: 'departments' }))
const deletePermission = computed(() => permissions.resolve('delete', { subject: 'departments' }))

function handleEdit() {
  setCurrentRow(props.row)
  setOpen('edit')
}

function handleDelete() {
  setCurrentRow(props.row)
  setOpen('delete')
}
</script>

<template>
  <DropdownMenu :modal="false">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="size-8 data-[state=open]:bg-muted"
      >
        <Ellipsis class="size-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-36">
      <PermissionTooltip :message="editPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!editPermission.allowed" @click="handleEdit">
          Edit
          <DropdownMenuShortcut>
            <Pencil :size="16" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </PermissionTooltip>

      <DropdownMenuSeparator />

      <PermissionTooltip :message="deletePermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          :disabled="!deletePermission.allowed"
          @click="handleDelete"
        >
          Delete
          <DropdownMenuShortcut>
            <Trash2 :size="16" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </PermissionTooltip>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
