<script setup lang="ts">
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Button } from '@admin/components/ui/button'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { Building2 } from 'lucide-vue-next'
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'add'): void
}>()

const permissions = usePageActionPermissions()
const createPermission = computed(() => permissions.resolve('create', { subject: 'departments' }))
</script>

<template>
  <div class="flex gap-2">
    <PermissionTooltip :message="createPermission.reason">
      <Button class="space-x-1" :disabled="!createPermission.allowed" @click="emit('add')">
        <span>Add Department</span>
        <Building2 :size="18" />
      </Button>
    </PermissionTooltip>
  </div>
</template>
