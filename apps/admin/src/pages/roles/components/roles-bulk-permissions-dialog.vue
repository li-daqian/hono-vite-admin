<script setup lang="ts">
import type { RolePermissionsResponseSchema, RoleProfileResponseSchema } from '@admin/client'
import type { PermissionSummary, PermissionTemplateId } from '@admin/components/ui/permission-tree/model'
import type { RoleItem } from './roles-columns'
import { getRole, getRoleByIdPermissions, putRoleByIdPermissions } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
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
  getEnabledPermissionSummaries,
  mergeEnabledPermissions,
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
import { Copy, ShieldCheck, WandSparkles } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import PermissionDiffPreview from './permission-diff-preview.vue'

const props = defineProps<{
  open: boolean
  roles: RoleItem[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const isPrefilling = ref(false)
const isSubmitting = ref(false)
const isApplyingSourceRole = ref(false)
const grantPermissions = ref<RolePermissionsResponseSchema>([])
const targetPermissions = ref<Record<string, RolePermissionsResponseSchema>>({})
const availableRoles = ref<RoleProfileResponseSchema[]>([])
const selectedTemplate = ref<PermissionTemplateId | 'none'>('none')
const selectedSourceRoleId = ref('none')

const selectedRoleCount = computed(() => props.roles.length)
const grantSummaries = computed(() => getEnabledPermissionSummaries(grantPermissions.value))
const grantCount = computed(() => grantSummaries.value.length)

const rolePreviews = computed(() => {
  return props.roles.map((role) => {
    const currentPermissions = targetPermissions.value[role.id] ?? []
    const nextPermissions = mergeEnabledPermissions(currentPermissions, grantPermissions.value)
    const diff = diffPermissionTrees(currentPermissions, nextPermissions)

    return {
      role,
      added: diff.added,
      nextPermissions,
    }
  })
})

const changedRolePreviews = computed(() => rolePreviews.value.filter(preview => preview.added.length > 0))
const totalAddedCount = computed(() => changedRolePreviews.value.reduce((total, preview) => total + preview.added.length, 0))
const uniqueAddedSummaries = computed(() => {
  const seen = new Set<string>()
  const summaries: PermissionSummary[] = []

  for (const preview of changedRolePreviews.value) {
    for (const summary of preview.added) {
      if (seen.has(summary.key))
        continue

      seen.add(summary.key)
      summaries.push(summary)
    }
  }

  return summaries
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function fetchBatchPermissions() {
  if (!props.open || props.roles.length === 0)
    return

  isPrefilling.value = true
  try {
    const [permissionResponses, rolesResponse] = await Promise.all([
      Promise.all(props.roles.map(role => getRoleByIdPermissions<true>({ path: { id: role.id } }))),
      getRole<true>(),
    ])

    const nextTargetPermissions: Record<string, RolePermissionsResponseSchema> = {}
    permissionResponses.forEach((response, index) => {
      const role = props.roles[index]
      if (!role)
        return

      nextTargetPermissions[role.id] = clonePermissionTree(response.data)
    })

    targetPermissions.value = nextTargetPermissions
    grantPermissions.value = permissionResponses[0]
      ? applyPermissionTemplate(permissionResponses[0].data, 'empty')
      : []
    availableRoles.value = rolesResponse.data
    selectedTemplate.value = 'none'
    selectedSourceRoleId.value = 'none'
  }
  finally {
    isPrefilling.value = false
  }
}

function applyTemplate() {
  if (selectedTemplate.value === 'none')
    return

  grantPermissions.value = applyPermissionTemplate(grantPermissions.value, selectedTemplate.value)
}

async function applySourceRolePermissions() {
  if (selectedSourceRoleId.value === 'none')
    return

  isApplyingSourceRole.value = true
  try {
    const response = await getRoleByIdPermissions<true>({ path: { id: selectedSourceRoleId.value } })
    grantPermissions.value = clonePermissionTree(response.data)
  }
  finally {
    isApplyingSourceRole.value = false
  }
}

async function handleSubmit() {
  if (changedRolePreviews.value.length === 0) {
    toast.success('Selected roles already have these permissions.')
    handleOpenChange(false)
    return
  }

  isSubmitting.value = true
  try {
    for (const preview of changedRolePreviews.value) {
      await putRoleByIdPermissions<true>({
        path: { id: preview.role.id },
        body: preview.nextPermissions,
      })
    }

    toast.success(`Granted permissions to ${changedRolePreviews.value.length} role${changedRolePreviews.value.length > 1 ? 's' : ''}.`)
    emit('success')
    handleOpenChange(false)
  }
  finally {
    isSubmitting.value = false
  }
}

watch(
  () => [props.open, props.roles.map(role => role.id).join(',')] as const,
  () => {
    void fetchBatchPermissions()
  },
  { immediate: true },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader class="text-start shrink-0">
        <DialogTitle>Batch Grant Permissions</DialogTitle>
        <DialogDescription>
          Grant selected permissions to {{ selectedRoleCount }} role{{ selectedRoleCount > 1 ? 's' : '' }}.
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Skeleton v-if="isPrefilling" class="h-72" />

        <div v-else class="grid min-h-0 gap-4 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PermissionTree v-model="grantPermissions" />

          <div class="space-y-4">
            <div class="rounded-md border p-3">
              <div class="mb-3 flex items-center gap-2">
                <ShieldCheck class="size-4 text-muted-foreground" />
                <h3 class="text-sm font-medium">
                  Grant Summary
                </h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {{ grantCount }} selected
                </Badge>
                <Badge variant="outline">
                  {{ changedRolePreviews.length }}/{{ selectedRoleCount }} roles changed
                </Badge>
                <Badge variant="outline">
                  {{ totalAddedCount }} additions
                </Badge>
              </div>
            </div>

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

            <div class="rounded-md border p-3">
              <h3 class="mb-2 text-sm font-medium">
                Role Impact
              </h3>
              <div class="space-y-1">
                <div
                  v-for="preview in rolePreviews.slice(0, 6)"
                  :key="preview.role.id"
                  class="flex items-center justify-between gap-2 rounded-sm bg-muted/40 px-2 py-1.5 text-sm"
                >
                  <span class="truncate">{{ preview.role.name }}</span>
                  <Badge variant="outline" class="shrink-0">
                    +{{ preview.added.length }}
                  </Badge>
                </div>
                <p v-if="rolePreviews.length > 6" class="text-xs text-muted-foreground">
                  +{{ rolePreviews.length - 6 }} more roles
                </p>
              </div>
            </div>

            <PermissionDiffPreview
              :added="uniqueAddedSummaries"
              empty-message="No new permissions will be granted."
            />
          </div>
        </div>

        <Separator class="mt-4" />
        <DialogFooter class="pt-4 shrink-0">
          <Button variant="outline" :disabled="isSubmitting" @click="handleOpenChange(false)">
            Cancel
          </Button>
          <Button
            :disabled="isSubmitting || isPrefilling || grantCount === 0"
            :class="isSubmitting ? 'animate-pulse' : undefined"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Granting...</span>
            <span v-else>Grant permissions</span>
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
