<script setup lang="ts">
import type { MenuItemSchema, RolePermissionsResponseSchema } from '@admin/client'
import { getMenu } from '@admin/client'
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

onMounted(async () => {
  try {
    const res = await getMenu<true>()
    tree.value = res.data
  }
  finally {
    isLoading.value = false
  }
})

function buildAncestorMap(nodes: MenuItemSchema[], ancestors: string[] = []): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const node of nodes) {
    map.set(node.id, ancestors)
    const childMap = buildAncestorMap(node.children, [...ancestors, node.id])
    childMap.forEach((v, k) => map.set(k, v))
  }
  return map
}

const ancestorMap = computed(() => buildAncestorMap(tree.value))

function getAllMenuIds(node: MenuItemSchema): string[] {
  return [node.id, ...node.children.flatMap(getAllMenuIds)]
}

function getAllActionIds(node: MenuItemSchema): string[] {
  return [...node.actions.map(a => a.id), ...node.children.flatMap(getAllActionIds)]
}

function toggleMenu(node: MenuItemSchema, currentState: boolean | 'indeterminate') {
  const allMenuIds = getAllMenuIds(node)
  const allActionIds = getAllActionIds(node)

  const newMenuIds = new Set(selectedMenuIds.value)
  const newActionIds = new Set(selectedActionIds.value)

  if (currentState !== true) {
    // Unchecked or indeterminate → check all: add self + all descendants + ancestors
    allMenuIds.forEach(id => newMenuIds.add(id))
    allActionIds.forEach(id => newActionIds.add(id))
    const ancestors = ancestorMap.value.get(node.id) ?? []
    ancestors.forEach(id => newMenuIds.add(id))
  }
  else {
    // Fully checked → uncheck: remove self + all descendants
    allMenuIds.forEach(id => newMenuIds.delete(id))
    allActionIds.forEach(id => newActionIds.delete(id))
  }

  emit('update:modelValue', { menuIds: [...newMenuIds], actionIds: [...newActionIds] })
}

function toggleAction(node: MenuItemSchema, actionId: string, checked: boolean) {
  const newActionIds = new Set(selectedActionIds.value)
  const newMenuIds = new Set(selectedMenuIds.value)

  if (checked) {
    newActionIds.add(actionId)
    // Auto-check parent menu and all ancestors
    newMenuIds.add(node.id)
    const ancestors = ancestorMap.value.get(node.id) ?? []
    ancestors.forEach(id => newMenuIds.add(id))
  }
  else {
    newActionIds.delete(actionId)
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
        :ancestor-map="ancestorMap"
        @toggle-menu="toggleMenu"
        @toggle-action="toggleAction"
      />
    </div>
  </div>
</template>
