<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
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
import { Ellipsis, Key, LockOpen, Trash2, UserPen } from 'lucide-vue-next'
import { computed } from 'vue'
import { useUsers } from './users-provider.vue'

type User = UserProfileResponseSchema

const props = defineProps<{
  row: User
}>()

const { setOpen, setCurrentRow } = useUsers()
const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { subject: 'users' }))
const passwordPermission = computed(() => permissions.resolve('password', { actionName: 'Change password' }))
const unlockPermission = computed(() => permissions.resolve('unlock', { actionName: 'Unlock', subject: 'users' }))
const deletePermission = computed(() => permissions.resolve('delete', { subject: 'users' }))
const isLocked = computed(() => Boolean(props.row.lockedUntil && props.row.lockedUntil.getTime() > Date.now()))

function handleEdit() {
  setCurrentRow(props.row)
  setOpen('edit')
}

function handleDelete() {
  setCurrentRow(props.row)
  setOpen('delete')
}

function handlePassword() {
  setCurrentRow(props.row)
  setOpen('password')
}

function handleUnlock() {
  setCurrentRow(props.row)
  setOpen('unlock')
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

    <DropdownMenuContent align="end" class="w-48">
      <PermissionTooltip :message="editPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!editPermission.allowed" @click="handleEdit">
          Edit
          <DropdownMenuShortcut>
            <UserPen :size="16" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </PermissionTooltip>

      <PermissionTooltip :message="passwordPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!passwordPermission.allowed" @click="handlePassword">
          Change Password
          <DropdownMenuShortcut>
            <Key :size="16" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </PermissionTooltip>

      <PermissionTooltip v-if="isLocked" :message="unlockPermission.reason" wrapper-class="block w-full">
        <DropdownMenuItem :disabled="!unlockPermission.allowed" @click="handleUnlock">
          Unlock
          <DropdownMenuShortcut>
            <LockOpen :size="16" />
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
