<script setup lang="ts">
import type { MenuItemSchema, RolePermissionsResponseSchema } from '@admin/client'
import type { PermissionTreeCheckState, PermissionTreeNode as PermissionTreeNodeModel } from './model'
import { getMenuOptions } from '@admin/client'
import { Loader2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import {
  buildPermissionTreeIndexes,
  getAllActionIds,
  getAllMenuIds,
  hasSelectedDescendants,
  mapMenuTreeToPermissionTree,
} from './model'
import PermissionTreeNode from './PermissionTreeNode.vue'

const props = defineProps<{
  modelValue: RolePermissionsResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RolePermissionsResponseSchema): void
}>()

const tree = ref<PermissionTreeNodeModel[]>([])
const isLoading = ref(true)

const selectedMenuIds = computed(() => new Set(props.modelValue.menuIds))
const selectedActionIds = computed(() => new Set(props.modelValue.actionIds))

onMounted(async () => {
  try {
    const res = await getMenuOptions<true>()
    tree.value = mapMenuTreeToPermissionTree(res.data as MenuItemSchema[])
  }
  finally {
    isLoading.value = false
  }
})

const treeIndexes = computed(() => buildPermissionTreeIndexes(tree.value))

function getAncestorIds(menuId: string): string[] {
  const ancestorIds: string[] = []
  let currentId = treeIndexes.value.parentById.get(menuId) ?? null

  while (currentId) {
    ancestorIds.push(currentId)
    currentId = treeIndexes.value.parentById.get(currentId) ?? null
  }

  return ancestorIds
}

function syncAncestorMenus(startMenuId: string | null, menuIds: Set<string>, actionIds: Set<string>) {
  let currentId = startMenuId

  while (currentId) {
    const currentNode = treeIndexes.value.nodeById.get(currentId)
    if (!currentNode)
      break

    if (hasSelectedDescendants(currentNode, menuIds, actionIds))
      menuIds.add(currentId)
    else
      menuIds.delete(currentId)

    currentId = treeIndexes.value.parentById.get(currentId) ?? null
  }
}

function toggleMenu(node: PermissionTreeNodeModel, currentState: PermissionTreeCheckState) {
  const allMenuIds = getAllMenuIds(node)
  const allActionIds = getAllActionIds(node)

  const newMenuIds = new Set(selectedMenuIds.value)
  const newActionIds = new Set(selectedActionIds.value)

  if (currentState !== true) {
    allMenuIds.forEach(id => newMenuIds.add(id))
    allActionIds.forEach(id => newActionIds.add(id))
    getAncestorIds(node.id).forEach(id => newMenuIds.add(id))
  }
  else {
    allMenuIds.forEach(id => newMenuIds.delete(id))
    allActionIds.forEach(id => newActionIds.delete(id))
    syncAncestorMenus(treeIndexes.value.parentById.get(node.id) ?? null, newMenuIds, newActionIds)
  }

  emit('update:modelValue', { menuIds: [...newMenuIds], actionIds: [...newActionIds] })
}

function toggleAction(node: PermissionTreeNodeModel, actionId: string, checked: boolean) {
  const newActionIds = new Set(selectedActionIds.value)
  const newMenuIds = new Set(selectedMenuIds.value)

  if (checked) {
    newActionIds.add(actionId)
    newMenuIds.add(node.id)
    getAncestorIds(node.id).forEach(id => newMenuIds.add(id))
  }
  else {
    newActionIds.delete(actionId)
    syncAncestorMenus(node.id, newMenuIds, newActionIds)
  }

  emit('update:modelValue', { menuIds: [...newMenuIds], actionIds: [...newActionIds] })
}
</script>

<template>
  <div class="rounded-md border bg-card">
    <div v-if="isLoading" class="flex items-center gap-2 p-4 text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
      <span class="text-sm">Loading permissions...</span>
    </div>

    <div v-else-if="tree.length === 0" class="p-4 text-sm text-muted-foreground text-center">
      No menus configured yet.
    </div>

    <div v-else class="p-2 space-y-0.5">
      <PermissionTreeNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :depth="0"
        :selected-menu-ids="selectedMenuIds"
        :selected-action-ids="selectedActionIds"
        @toggle-menu="toggleMenu"
        @toggle-action="toggleAction"
      />
    </div>
  </div>
</template>
