<script setup lang="ts">
import type { PermissionTreeCheckState, PermissionTreeNode as PermissionTreeNodeModel } from './model'
import { Checkbox } from '@admin/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@admin/components/ui/collapsible'
import { cn } from '@admin/lib/utils'
import { ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { getNodeCheckState } from './model'
import PermissionTreeNode from './PermissionTreeNode.vue'

defineOptions({ name: 'PermissionTreeNode' })

const props = defineProps<{
  node: PermissionTreeNodeModel
  depth: number
  selectedMenuIds: Set<string>
  selectedActionIds: Set<string>
}>()

const emit = defineEmits<{
  toggleMenu: [node: PermissionTreeNodeModel, state: PermissionTreeCheckState]
  toggleAction: [node: PermissionTreeNodeModel, actionId: string, checked: boolean]
}>()

const isOpen = ref(true)

const hasChildren = computed(() => props.node.children.length > 0 || props.node.actions.length > 0)

const menuCheckState = computed(() => getNodeCheckState(props.node, props.selectedMenuIds, props.selectedActionIds))

function handleActionCheckedChange(node: PermissionTreeNodeModel, actionId: string, checked: boolean | 'indeterminate') {
  emit('toggleAction', node, actionId, checked === true)
}
</script>

<template>
  <div :style="{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }">
    <Collapsible v-model:open="isOpen">
      <div
        class="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
        @click="emit('toggleMenu', node, menuCheckState)"
      >
        <CollapsibleTrigger as-child>
          <button
            :class="cn(
              'flex size-4 items-center justify-center rounded text-muted-foreground transition-transform shrink-0',
              !hasChildren && 'invisible',
              isOpen && 'rotate-90',
            )"
            @click.stop
          >
            <ChevronRight class="size-3.5" />
          </button>
        </CollapsibleTrigger>

        <Checkbox
          :checked="menuCheckState"
          @click.stop
          @update:checked="emit('toggleMenu', node, menuCheckState)"
        />
        <span class="text-sm select-none">
          {{ node.name }}
        </span>
        <span v-if="node.description" class="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
          {{ node.description }}
        </span>
      </div>

      <CollapsibleContent>
        <!-- Actions -->
        <div
          v-for="action in node.actions"
          :key="action.id"
          :style="{ paddingLeft: `${(depth + 1) * 16 + 4}px` }"
          class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
          @click="emit('toggleAction', node, action.id, !selectedActionIds.has(action.id))"
        >
          <span class="invisible size-4 shrink-0" />
          <Checkbox
            :checked="selectedActionIds.has(action.id)"
            @click.stop
            @update:checked="handleActionCheckedChange(node, action.id, $event)"
          />
          <span class="text-sm text-muted-foreground select-none">
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
          @toggle-menu="(n, s) => emit('toggleMenu', n, s)"
          @toggle-action="(n, id, c) => emit('toggleAction', n, id, c)"
        />
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
