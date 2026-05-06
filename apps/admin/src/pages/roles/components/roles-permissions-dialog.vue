<script setup lang="ts">
import type { RolePermissionsResponseSchema, RoleProfileResponseSchema } from '@admin/client'
import type { PermissionTemplateId } from '@admin/components/ui/permission-tree/model'
import { getRole, getRoleByIdPermissions, putRoleByIdPermissions } from '@admin/client'
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
import {
  applyPermissionTemplate,
  clonePermissionTree,
  diffPermissionTrees,
  PERMISSION_TEMPLATES,
} from '@admin/components/ui/permission-tree/model'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import { Separator } from '@admin/components/ui/separator'
import { Skeleton } from '@admin/components/ui/skeleton'
import { Copy, RotateCcw, WandSparkles } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import PermissionDiffPreview from './permission-diff-preview.vue'

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
const isApplyingSourceRole = ref(false)
const originalPermissions = ref<RolePermissionsResponseSchema>([])
const permissions = ref<RolePermissionsResponseSchema>([])
const availableRoles = ref<RoleProfileResponseSchema[]>([])
const selectedTemplate = ref<PermissionTemplateId | 'none'>('none')
const selectedSourceRoleId = ref('none')

const permissionDiff = computed(() => diffPermissionTrees(originalPermissions.value, permissions.value))
const hasPermissionChanges = computed(() => permissionDiff.value.added.length > 0 || permissionDiff.value.removed.length > 0)
const selectedTemplateDescription = computed(() => {
  return PERMISSION_TEMPLATES.find(template => template.id === selectedTemplate.value)?.description
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function fetchPermissions(roleId: string) {
  isPrefilling.value = true
  try {
    const [permissionsResponse, rolesResponse] = await Promise.all([
      getRoleByIdPermissions<true>({ path: { id: roleId } }),
      getRole<true>(),
    ])

    originalPermissions.value = clonePermissionTree(permissionsResponse.data)
    permissions.value = clonePermissionTree(permissionsResponse.data)
    availableRoles.value = rolesResponse.data.filter(role => role.id !== roleId)
    selectedTemplate.value = 'none'
    selectedSourceRoleId.value = 'none'
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

function applyTemplate() {
  if (selectedTemplate.value === 'none')
    return

  permissions.value = applyPermissionTemplate(permissions.value, selectedTemplate.value)
}

async function applySourceRolePermissions() {
  if (selectedSourceRoleId.value === 'none')
    return

  isApplyingSourceRole.value = true
  try {
    const response = await getRoleByIdPermissions<true>({ path: { id: selectedSourceRoleId.value } })
    permissions.value = clonePermissionTree(response.data)
  }
  finally {
    isApplyingSourceRole.value = false
  }
}

function resetPermissions() {
  permissions.value = clonePermissionTree(originalPermissions.value)
  selectedTemplate.value = 'none'
  selectedSourceRoleId.value = 'none'
}

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
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
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
          <div v-else class="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <PermissionTree v-model="permissions" />

            <div class="space-y-4">
              <div class="rounded-md border p-3">
                <div class="mb-3 flex items-center gap-2">
                  <WandSparkles class="size-4 text-muted-foreground" />
                  <h3 class="text-sm font-medium">
                    Permission Template
                  </h3>
                </div>
                <div class="flex gap-2">
                  <Select v-model="selectedTemplate">
                    <SelectTrigger class="h-9 min-w-0 flex-1">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Select template
                      </SelectItem>
                      <SelectItem v-for="template in PERMISSION_TEMPLATES" :key="template.id" :value="template.id">
                        {{ template.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    class="shrink-0"
                    :disabled="selectedTemplate === 'none'"
                    @click="applyTemplate"
                  >
                    Apply
                  </Button>
                </div>
                <p v-if="selectedTemplateDescription" class="mt-2 text-xs text-muted-foreground">
                  {{ selectedTemplateDescription }}
                </p>
              </div>

              <div class="rounded-md border p-3">
                <div class="mb-3 flex items-center gap-2">
                  <Copy class="size-4 text-muted-foreground" />
                  <h3 class="text-sm font-medium">
                    Copy Permissions
                  </h3>
                </div>
                <div class="flex gap-2">
                  <Select v-model="selectedSourceRoleId">
                    <SelectTrigger class="h-9 min-w-0 flex-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Select role
                      </SelectItem>
                      <SelectItem v-for="role in availableRoles" :key="role.id" :value="role.id">
                        {{ role.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    class="shrink-0"
                    :disabled="selectedSourceRoleId === 'none' || isApplyingSourceRole"
                    :class="isApplyingSourceRole ? 'animate-pulse' : undefined"
                    @click="applySourceRolePermissions"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <PermissionDiffPreview
                :added="permissionDiff.added"
                :removed="permissionDiff.removed"
              />
            </div>
          </div>
        </div>

        <Separator class="mt-4" />
        <DialogFooter class="pt-4 shrink-0">
          <Button
            variant="ghost"
            :disabled="isSubmitting || isPrefilling || !hasPermissionChanges"
            class="mr-auto"
            @click="resetPermissions"
          >
            <RotateCcw class="size-4" />
            Reset
          </Button>
          <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button
            :disabled="isSubmitting || isPrefilling || !hasPermissionChanges"
            :class="isSubmitting ? 'animate-pulse' : undefined"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Saving...</span>
            <span v-else>Save permissions</span>
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
