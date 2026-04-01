<script setup lang="ts">
import type { RolePermissionsResponseSchema } from '@admin/client'
import { getRoleByIdPermissions, putRoleByIdPermissions } from '@admin/client'
import { Button } from '@admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog'
import { PermissionTree } from '@admin/components/ui/permission-tree'
import { Skeleton } from '@admin/components/ui/skeleton'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  id?: string
  roleName?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const isPrefilling = ref(false)
const isSubmitting = ref(false)
const permissions = ref<RolePermissionsResponseSchema>([])

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function fetchPermissions(roleId: string) {
  isPrefilling.value = true
  try {
    const response = await getRoleByIdPermissions<true>({ path: { id: roleId } })
    permissions.value = response.data
  }
  finally {
    isPrefilling.value = false
  }
}

watch(
  () => [props.open, props.id] as const,
  async ([open, roleId]) => {
    if (!open || !roleId)
      return

    await fetchPermissions(roleId)
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!props.id) {
    toast.error('Cannot update permissions: missing role id.')
    return
  }

  isSubmitting.value = true
  try {
    await putRoleByIdPermissions<true>({
      path: { id: props.id },
      body: permissions.value,
    })
    toast.success(`Permissions for "${props.roleName ?? 'role'}" updated.`)
    emit('success')
    handleOpenChange(false)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>Edit Permissions</DialogTitle>
        <DialogDescription>
          Configure which permission nodes the role can access.
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="space-y-2 overflow-y-auto flex-1 pr-1">
          <p v-if="props.roleName" class="text-sm text-muted-foreground">
            Role: <span class="font-medium text-foreground">{{ props.roleName }}</span>
          </p>

          <Skeleton v-if="isPrefilling" class="h-56" />
          <PermissionTree v-else v-model="permissions" />
        </div>

        <DialogFooter class="pt-4 shrink-0">
          <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button :disabled="isSubmitting || isPrefilling" @click="handleSubmit">
            <span v-if="isSubmitting">Saving...</span>
            <span v-else>Save permissions</span>
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
