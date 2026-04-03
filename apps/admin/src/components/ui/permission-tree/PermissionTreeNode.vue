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
  state: PermissionTreeCheckState
}>()

const emit = defineEmits<{
  toggle: [nodeId: string, state: PermissionTreeCheckState]
}>()

const isOpen = ref(true)

const hasChildren = computed(() => props.node.children.length > 0)
</script>

<template>
  <div :style="{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }">
    <Collapsible v-model:open="isOpen">
      <div
        class="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
        @click="emit('toggle', node.id, state)"
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
          :model-value="state"
          @click.stop
          @update:model-value="emit('toggle', node.id, state)"
        />
        <span class="text-sm select-none">
          {{ node.name }}
        </span>
        <span v-if="node.description" class="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
          {{ node.description }}
        </span>
      </div>

      <CollapsibleContent>
        <PermissionTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :state="getNodeCheckState(child)"
          @toggle="(id, childState) => emit('toggle', id, childState)"
        />
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
