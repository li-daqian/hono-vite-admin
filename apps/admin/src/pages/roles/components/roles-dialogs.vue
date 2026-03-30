<script setup lang="ts">
import { computed } from 'vue'
import RolesActionDialog from './roles-action-dialog.vue'
import RolesDeleteDialog from './roles-delete-dialog.vue'
import { useRoles } from './roles-provider.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { open, setOpen, currentRow, setCurrentRow } = useRoles()

const editRoleId = computed(() => currentRow.value?.id)

function clearCurrentRowWithDelay() {
  setTimeout(() => setCurrentRow(null), 500)
}

function handleAddOpenChange(value: boolean) {
  setOpen(value ? 'add' : null)
  if (!value)
    setCurrentRow(null)
}

function handleEditOpenChange(value: boolean) {
  setOpen(value ? 'edit' : null)
  if (!value)
    setCurrentRow(null)
}

function handleDeleteOpenChange(value: boolean) {
  if (value) {
    setOpen('delete')
    return
  }
  setOpen(null)
  clearCurrentRowWithDelay()
}
</script>

<template>
  <RolesActionDialog
    :open="open === 'add'"
    mode="add"
    @success="emit('success')"
    @update:open="handleAddOpenChange"
  />

  <RolesActionDialog
    v-if="currentRow"
    :id="editRoleId"
    :open="open === 'edit'"
    mode="edit"
    @success="emit('success')"
    @update:open="handleEditOpenChange"
  />

  <RolesDeleteDialog
    v-if="currentRow"
    :open="open === 'delete'"
    :current-row="currentRow"
    @success="emit('success')"
    @update:open="handleDeleteOpenChange"
  />
</template>
