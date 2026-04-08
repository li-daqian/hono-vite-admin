<script setup lang="ts">
import type { RoleItem } from '@admin/pages/roles/components/roles-columns'
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
import { Ellipsis, KeyRound, Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoles } from './roles-provider.vue'

const props = defineProps<{
  row: RoleItem
}>()

const { setOpen, setCurrentRow } = useRoles()
const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { subject: 'roles' }))
const managePermissionsPermission = computed(() => permissions.resolve('permissions', {
  actionName: 'manage role permissions',
}))
const deletePermission = computed(() => permissions.resolve('delete', { subject: 'roles' }))

function handleEdit() {
  setCurrentRow(props.row)
  setOpen('edit')
}

function handleDelete() {
  setCurrentRow(props.row)
  setOpen('delete')
}

function handlePermissions() {
  setCurrentRow(props.row)
  setOpen('permissions')
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

    <DropdownMenuContent align="end" class="w-40">
      <PermissionTooltip :message="editPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!editPermission.allowed" @click="handleEdit">
          Edit
          <DropdownMenuShortcut>
            <Pencil :size="16" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </PermissionTooltip>

      <PermissionTooltip :message="managePermissionsPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!managePermissionsPermission.allowed" @click="handlePermissions">
          Permissions
          <DropdownMenuShortcut>
            <KeyRound :size="16" />
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
