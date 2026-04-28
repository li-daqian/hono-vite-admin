<script setup lang="ts">
import { computed } from 'vue'
import DepartmentsActionDialog from './departments-action-dialog.vue'
import DepartmentsDeleteDialog from './departments-delete-dialog.vue'
import { useDepartments } from './departments-provider.vue'
import DepartmentsUsersDialog from './departments-users-dialog.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { open, setOpen, currentRow, setCurrentRow, refreshDepartments } = useDepartments()
const editDepartmentId = computed(() => currentRow.value?.id)

function clearCurrentRowWithDelay() {
  setTimeout(() => setCurrentRow(null), 500)
}

async function handleSuccess() {
  await refreshDepartments()
  emit('success')
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

function handleUsersOpenChange(value: boolean) {
  setOpen(value ? 'users' : null)
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
  <DepartmentsActionDialog
    :open="open === 'add'"
    mode="add"
    @success="handleSuccess"
    @update:open="handleAddOpenChange"
  />

  <DepartmentsActionDialog
    v-if="currentRow"
    :id="editDepartmentId"
    :open="open === 'edit'"
    mode="edit"
    @success="handleSuccess"
    @update:open="handleEditOpenChange"
  />

  <DepartmentsUsersDialog
    v-if="currentRow"
    :open="open === 'users'"
    :current-row="currentRow"
    @success="handleSuccess"
    @update:open="handleUsersOpenChange"
  />

  <DepartmentsDeleteDialog
    v-if="currentRow"
    :open="open === 'delete'"
    :current-row="currentRow"
    @success="handleSuccess"
    @update:open="handleDeleteOpenChange"
  />
</template>
