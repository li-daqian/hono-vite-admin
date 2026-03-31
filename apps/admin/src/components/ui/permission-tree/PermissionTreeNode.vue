<script setup lang="ts">
import type { MenuItemSchema } from '@admin/client'
import { Checkbox } from '@admin/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@admin/components/ui/collapsible'
import { cn } from '@admin/lib/utils'
import { ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import PermissionTreeNode from './PermissionTreeNode.vue'

defineOptions({ name: 'PermissionTreeNode' })

const props = defineProps<{
  node: MenuItemSchema
  depth: number
  selectedMenuIds: Set<string>
  selectedActionIds: Set<string>
  ancestorMap: Map<string, string[]>
  description?: string
}>()

const emit = defineEmits<{
  toggleMenu: [node: MenuItemSchema, state: boolean | 'indeterminate']
  toggleAction: [node: MenuItemSchema, actionId: string, checked: boolean]
}>()

const isOpen = ref(true)

const hasChildren = computed(() => props.node.children.length > 0 || props.node.actions.length > 0)

function getAllMenuIds(node: MenuItemSchema): string[] {
  return [node.id, ...node.children.flatMap(getAllMenuIds)]
}

function getAllActionIds(node: MenuItemSchema): string[] {
  return [...node.actions.map(a => a.id), ...node.children.flatMap(getAllActionIds)]
}

const menuCheckState = computed<boolean | 'indeterminate'>(() => {
  const allMenus = getAllMenuIds(props.node)
  const allActions = getAllActionIds(props.node)

  const checkedMenus = allMenus.filter(id => props.selectedMenuIds.has(id)).length
  const checkedActions = allActions.filter(id => props.selectedActionIds.has(id)).length

  const totalChecked = checkedMenus + checkedActions
  const totalItems = allMenus.length + allActions.length

  if (totalChecked === 0)
    return false
  if (totalChecked === totalItems)
    return true
  return 'indeterminate'
})
</script>

<template>
  <div :style="{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }">
    <Collapsible v-model:open="isOpen">
      <div class="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/50 group">
        <CollapsibleTrigger as-child>
          <button
            :class="cn(
              'flex size-4 items-center justify-center rounded text-muted-foreground transition-transform shrink-0',
              !hasChildren && 'invisible',
              isOpen && 'rotate-90',
            )"
          >
            <ChevronRight class="size-3.5" />
          </button>
        </CollapsibleTrigger>

        <Checkbox
          :checked="menuCheckState"
          @update:checked="emit('toggleMenu', node, menuCheckState)"
        />
        <span class="text-sm select-none cursor-pointer" @click="emit('toggleMenu', node, menuCheckState)">
          {{ node.name }}
        </span>
        <span v-if="description" class="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
          {{ description }}
        </span>
      </div>

      <CollapsibleContent>
        <!-- Actions -->
        <div
          v-for="action in node.actions"
          :key="action.id"
          :style="{ paddingLeft: `${(depth + 1) * 16 + 4}px` }"
          class="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
        >
          <span class="invisible size-4 shrink-0" />
          <Checkbox
            :checked="selectedActionIds.has(action.id)"
            @update:checked="(checked) => emit('toggleAction', node, action.id, !!checked)"
          />
          <span
            class="text-sm text-muted-foreground select-none cursor-pointer"
            @click="emit('toggleAction', node, action.id, !selectedActionIds.has(action.id))"
          >
            {{ action.name }}
          </span>
          <span v-if="action.description" class="ml-1 text-xs text-muted-foreground/60">
            — {{ action.description }}
          </span>
        </div>

        <!-- Child menus -->
        <PermissionTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :selected-menu-ids="selectedMenuIds"
          :selected-action-ids="selectedActionIds"
          :ancestor-map="ancestorMap"
          @toggle-menu="(n, s) => emit('toggleMenu', n, s)"
          @toggle-action="(n, id, c) => emit('toggleAction', n, id, c)"
        />
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
