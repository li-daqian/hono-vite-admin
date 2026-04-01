<script setup lang="ts">
import type { RolePermissionsResponseSchema } from '@admin/client'
import type { PermissionTreeNode as PermissionTreeNodeModel } from './model'
import { computed } from 'vue'
import { getNodeCheckState, togglePermissionNode } from './model'
import PermissionTreeNode from './PermissionTreeNode.vue'

const props = defineProps<{
  modelValue: RolePermissionsResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RolePermissionsResponseSchema): void
}>()

const tree = computed<PermissionTreeNodeModel[]>(() => props.modelValue)

function handleToggle(nodeId: string, currentState: boolean | 'indeterminate') {
  emit('update:modelValue', togglePermissionNode(tree.value, nodeId, currentState !== true))
}
</script>

<template>
  <div class="rounded-md border bg-card">
    <div v-if="tree.length === 0" class="p-4 text-sm text-muted-foreground text-center">
      No menus configured yet.
    </div>

    <div v-else class="space-y-0.5 p-2">
      <PermissionTreeNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :depth="0"
        :state="getNodeCheckState(node)"
        @toggle="handleToggle"
      />
    </div>
  </div>
</template>
