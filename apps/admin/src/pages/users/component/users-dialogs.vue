<script setup lang="ts">
import { computed } from 'vue'
import UsersActionDialog from './users-action-dialog.vue'
import UsersDeleteDialog from './users-delete-dialog.vue'
import { useUsers } from './users-provider.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { open, setOpen, currentRow, setCurrentRow } = useUsers()

const editUserId = computed(() => currentRow.value?.id)

function clearCurrentRowWithDelay() {
  setTimeout(() => {
    setCurrentRow(null)
  }, 500)
}

function handleAddOpenChange(value: boolean) {
  setOpen(value ? 'add' : null)
  if (!value)
    setCurrentRow(null)
}

function handleEditOpenChange(value: boolean) {
  if (value) {
    setOpen('edit')
    return
  }

  setOpen(null)
  clearCurrentRowWithDelay()
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
  <UsersActionDialog
    :open="open === 'add'"
    mode="add"
    @success="emit('success')"
    @update:open="handleAddOpenChange"
  />

  <UsersActionDialog
    v-if="currentRow"
    :id="editUserId"
    :open="open === 'edit'"
    mode="edit"
    @success="emit('success')"
    @update:open="handleEditOpenChange"
  />

  <UsersDeleteDialog
    v-if="currentRow"
    :open="open === 'delete'"
    :current-row="currentRow"
    @update:open="handleDeleteOpenChange"
  />
</template>
