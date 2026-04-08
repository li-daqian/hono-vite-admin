<script setup lang="ts">
import PermissionTooltip from '@admin/components/PermissionTooltip.vue'
import { Button } from '@admin/components/ui/button'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { UserPlus } from 'lucide-vue-next'
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'add'): void
}>()

const permissions = usePageActionPermissions()
const createPermission = computed(() => permissions.resolve('create', { subject: 'users' }))
</script>

<template>
  <div class="flex gap-2">
    <PermissionTooltip :message="createPermission.reason">
      <Button
        class="space-x-1"
        :disabled="!createPermission.allowed"
        @click="emit('add')"
      >
        <span>Add User</span>
        <UserPlus :size="18" />
      </Button>
    </PermissionTooltip>
  </div>
</template>
