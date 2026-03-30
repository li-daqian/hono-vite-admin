<script setup lang="ts">
import type { RoleItem } from '@admin/pages/roles/components/roles-columns'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
import { Ellipsis, Pencil, Trash2 } from 'lucide-vue-next'
import { useRoles } from './roles-provider.vue'

const props = defineProps<{
  row: RoleItem
}>()

const { setOpen, setCurrentRow } = useRoles()

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
          <Pencil :size="16" />
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
