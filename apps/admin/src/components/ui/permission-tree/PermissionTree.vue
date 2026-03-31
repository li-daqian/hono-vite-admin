<script setup lang="ts">
import type { MenuItemSchema, RolePermissionsResponseSchema } from '@admin/client'
import { getMenuOptions } from '@admin/client'
import { Loader2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import PermissionTreeNode from './PermissionTreeNode.vue'

const props = defineProps<{
  modelValue: RolePermissionsResponseSchema
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RolePermissionsResponseSchema): void
}>()

const tree = ref<MenuItemSchema[]>([])
const isLoading = ref(true)

const selectedMenuIds = computed(() => new Set(props.modelValue.menuIds))
const selectedActionIds = computed(() => new Set(props.modelValue.actionIds))

function buildTreeIndexes(nodes: MenuItemSchema[], parentId: string | null = null) {
  const nodeById = new Map<string, MenuItemSchema>()
  const parentById = new Map<string, string | null>()

  const visit = (items: MenuItemSchema[], currentParentId: string | null) => {
    for (const node of items) {
      nodeById.set(node.id, node)
      parentById.set(node.id, currentParentId)
      visit(node.children, node.id)
    }
  }

  visit(nodes, parentId)

  return { nodeById, parentById }
}

onMounted(async () => {
  try {
    const res = await getMenuOptions<true>()
    tree.value = res.data
  }
  finally {
    isLoading.value = false
  }
})

const treeIndexes = computed(() => buildTreeIndexes(tree.value))

function getAncestorIds(menuId: string): string[] {
  const ancestorIds: string[] = []
  let currentId = treeIndexes.value.parentById.get(menuId) ?? null

  while (currentId) {
    ancestorIds.push(currentId)
    currentId = treeIndexes.value.parentById.get(currentId) ?? null
  }

  return ancestorIds
}

function getAllMenuIds(node: MenuItemSchema): string[] {
  return [node.id, ...node.children.flatMap(getAllMenuIds)]
}

function getAllActionIds(node: MenuItemSchema): string[] {
  return [...node.actions.map(a => a.id), ...node.children.flatMap(getAllActionIds)]
}

function hasSelectedDescendants(node: MenuItemSchema, menuIds: Set<string>, actionIds: Set<string>): boolean {
  return node.actions.some(action => actionIds.has(action.id))
    || node.children.some(child => menuIds.has(child.id) || hasSelectedDescendants(child, menuIds, actionIds))
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

function toggleMenu(node: MenuItemSchema, currentState: boolean | 'indeterminate') {
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

function toggleAction(node: MenuItemSchema, actionId: string, checked: boolean) {
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
