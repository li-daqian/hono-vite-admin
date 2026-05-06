<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { RoleItem } from './roles-columns'
import { DataTableBulkActions as BulkActionsToolbar } from '@admin/components/data-table'
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Button } from '@admin/components/ui/button'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { KeyRound } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import RolesBulkPermissionsDialog from './roles-bulk-permissions-dialog.vue'

const props = defineProps<{
  table: Table<RoleItem>
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const showPermissionsDialog = ref(false)
const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows)
const selectedRoles = computed(() => selectedRows.value.map(row => row.original))
const permissions = usePageActionPermissions()
const managePermissionsPermission = computed(() => permissions.resolve('permissions', {
  actionName: 'manage role permissions',
}))

function handleSuccess() {
  props.table.resetRowSelection()
  emit('success')
}
</script>

<template>
  <BulkActionsToolbar :table="props.table" entity-name="role">
    <PermissionTooltip :message="managePermissionsPermission.reason">
      <Button
        variant="outline"
        size="icon"
        class="size-8"
        :disabled="!managePermissionsPermission.allowed"
        aria-label="Batch grant permissions"
        title="Batch grant permissions"
        @click="showPermissionsDialog = true"
      >
        <KeyRound />
        <span class="sr-only">Batch grant permissions</span>
      </Button>
    </PermissionTooltip>
  </BulkActionsToolbar>

  <RolesBulkPermissionsDialog
    :open="showPermissionsDialog"
    :roles="selectedRoles"
    @success="handleSuccess"
    @update:open="showPermissionsDialog = $event"
  />
</template>
