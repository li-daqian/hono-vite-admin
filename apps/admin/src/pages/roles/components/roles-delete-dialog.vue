<script setup lang="ts">
import type { RoleProfileResponseSchema } from '@admin/client'
import { deleteRoleById } from '@admin/client'
import ConfirmDialog from '@admin/components/ConfirmDialog.vue'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  currentRow: RoleProfileResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const value = ref('')
const isDeleting = ref(false)
const canDelete = computed(() => value.value.trim() === props.currentRow.name)

function handleOpenChange(open: boolean) {
  emit('update:open', open)
  if (!open)
    value.value = ''
}

async function handleDelete() {
  if (!canDelete.value)
    return

  isDeleting.value = true
  try {
    await deleteRoleById<true>({ path: { id: props.currentRow.id } })
    handleOpenChange(false)
    toast.success(`Role "${props.currentRow.name}" deleted.`)
    emit('success')
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :handle-confirm="handleDelete"
    :disabled="!canDelete"
    :is-loading="isDeleting"
    confirm-text="Delete"
    destructive
    @update:open="handleOpenChange"
  >
    <template #title>
      <span class="text-destructive">
        <AlertTriangle class="me-1 inline-block stroke-destructive" :size="18" />
        Delete Role
      </span>
    </template>

    <template #desc>
      <div class="space-y-4">
        <p class="text-sm leading-6">
          Are you sure you want to delete
          <span class="font-bold">{{ props.currentRow.name }}</span>?
          <br>
          This action will permanently remove this role. This cannot be undone.
        </p>

        <Label class="my-2 flex-col items-start gap-2">
          Role name:
          <Input
            v-model="value"
            placeholder="Enter role name to confirm deletion."
          />
        </Label>

        <div class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Warning: Deleting a role will remove it from all assigned users.
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
