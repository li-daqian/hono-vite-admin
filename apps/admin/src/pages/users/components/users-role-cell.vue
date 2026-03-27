<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { computed } from 'vue'
import { useUsers } from './users-provider.vue'

const props = defineProps<{
  row: UserProfileResponseSchema
}>()

const { getUserRoles } = useUsers()

const selectedRoles = computed(() => getUserRoles(props.row))
</script>

<template>
  <div class="flex min-h-9 w-full flex-wrap items-center gap-1 px-1 py-1">
    <template v-if="selectedRoles.length > 0">
      <Badge
        v-for="roleName in selectedRoles"
        :key="roleName"
        variant="outline"
        class="rounded-md border-border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-none"
      >
        {{ roleName }}
      </Badge>
    </template>
  </div>
</template>
