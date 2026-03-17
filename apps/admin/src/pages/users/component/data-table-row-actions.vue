<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
import { Ellipsis, Trash2, UserPen } from 'lucide-vue-next'
import { useUsers } from './users-provider.vue'

type User = UserProfileResponseSchema

const props = defineProps<{
  row: User
}>()

const { setOpen, setCurrentRow } = useUsers()

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

    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuItem @click="handleEdit">
        Edit
        <DropdownMenuShortcut>
          <UserPen :size="16" />
        </DropdownMenuShortcut>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleDelete">
        Delete
        <DropdownMenuShortcut>
          <Trash2 :size="16" />
        </DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
