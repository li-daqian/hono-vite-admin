<script setup lang="ts">
import type { DepartmentTreeItemSchema } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  TableCell,
  TableRow,
} from '@admin/components/ui/table'
import { cn } from '@admin/lib/utils'
import { ChevronRight, GripVertical } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'
import DepartmentsTreeNode from './departments-tree-node.vue'

type DropPosition = 'before' | 'after'

interface DropPayload {
  id: string
  position: DropPosition
}

defineOptions({ name: 'DepartmentsTreeNode' })

const props = defineProps<{
  node: DepartmentTreeItemSchema
  depth: number
  forceOpen?: boolean
  canDrag?: boolean
  draggingId?: string | null
  dropTargetId?: string | null
  dropPosition?: DropPosition | null
  dragDisabledReason?: string | null
  canDropOn?: (node: DepartmentTreeItemSchema) => boolean
}>()

const emit = defineEmits<{
  (e: 'dragStart', id: string, event: DragEvent): void
  (e: 'dragOver', payload: DropPayload, event: DragEvent): void
  (e: 'dragLeave', id: string, event: DragEvent): void
  (e: 'drop', payload: DropPayload, event: DragEvent): void
  (e: 'dragEnd'): void
}>()

const statusClassMap: Record<DepartmentTreeItemSchema['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

const isOpen = ref(true)
const hasChildren = computed(() => props.node.children.length > 0)
const childrenVisible = computed(() => props.forceOpen || isOpen.value)
const isDragging = computed(() => props.draggingId === props.node.id)
const isDropTarget = computed(() => props.dropTargetId === props.node.id)
const dragHandleTitle = computed(() => props.canDrag ? 'Drag to reorder' : props.dragDisabledReason ?? 'Clear filters and check edit permission to reorder')

function canDropCurrentNode() {
  return Boolean(
    props.canDrag
    && props.draggingId
    && props.draggingId !== props.node.id
    && props.canDropOn?.(props.node),
  )
}

function getDropPosition(event: DragEvent): DropPosition {
  const row = event.currentTarget as HTMLElement
  const rect = row.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function handleDragStart(event: DragEvent) {
  if (!props.canDrag) {
    event.preventDefault()
    return
  }

  event.dataTransfer?.setData('text/plain', props.node.id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }

  emit('dragStart', props.node.id, event)
}

function handleDragOver(event: DragEvent) {
  const payload = { id: props.node.id, position: getDropPosition(event) }

  if (!canDropCurrentNode()) {
    emit('dragOver', payload, event)
    return
  }

  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  emit('dragOver', payload, event)
}

function handleDragLeave(event: DragEvent) {
  const currentTarget = event.currentTarget as Node | null
  const relatedTarget = (event as DragEvent & { relatedTarget: EventTarget | null }).relatedTarget as Node | null

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  emit('dragLeave', props.node.id, event)
}

function handleDrop(event: DragEvent) {
  if (!canDropCurrentNode()) {
    return
  }

  event.preventDefault()
  emit('drop', { id: props.node.id, position: getDropPosition(event) }, event)
}
</script>

<template>
  <TableRow
    :class="cn(
      'group/row',
      isDragging && 'opacity-50',
      isDropTarget && dropPosition === 'before' && 'border-t-2 border-t-primary',
      isDropTarget && dropPosition === 'after' && 'border-b-2 border-b-primary',
    )"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <TableCell class="bg-background group-hover/row:bg-muted w-10 px-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :draggable="canDrag"
        :disabled="!canDrag"
        :title="dragHandleTitle"
        :class="cn(
          'size-7 text-muted-foreground',
          canDrag && 'cursor-grab active:cursor-grabbing hover:text-foreground',
        )"
        @dragstart="handleDragStart"
        @dragend="emit('dragEnd')"
      >
        <GripVertical class="size-4" />
        <span class="sr-only">Drag to reorder</span>
      </Button>
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted">
      <div class="flex min-w-[260px] items-center gap-2" :style="{ paddingLeft: `${depth * 1.25}rem` }">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          :class="cn(
            'size-6 shrink-0 text-muted-foreground',
            !hasChildren && 'invisible',
          )"
          @click="isOpen = !isOpen"
        >
          <ChevronRight :class="cn('size-4 transition-transform', childrenVisible && 'rotate-90')" />
          <span class="sr-only">Toggle children</span>
        </Button>

        <div class="min-w-0">
          <div class="truncate font-medium">
            {{ node.name }}
          </div>
        </div>
      </div>
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted">
      {{ node.leader ?? '-' }}
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted">
      <div class="max-w-[240px] space-y-1 text-sm">
        <div>{{ node.phone ?? '-' }}</div>
        <div class="text-muted-foreground truncate">
          {{ node.email ?? '-' }}
        </div>
      </div>
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted">
      <Badge variant="outline" :class="cn('capitalize', statusClassMap[node.status])">
        {{ node.status.toLowerCase() }}
      </Badge>
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted text-right">
      {{ node.userCount }}
    </TableCell>
    <TableCell class="bg-background group-hover/row:bg-muted">
      <div class="flex items-center justify-end">
        <DataTableRowActions :row="node" />
      </div>
    </TableCell>
  </TableRow>

  <template v-if="hasChildren && childrenVisible">
    <DepartmentsTreeNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :depth="depth + 1"
      :force-open="forceOpen"
      :can-drag="canDrag"
      :dragging-id="draggingId"
      :drop-target-id="dropTargetId"
      :drop-position="dropPosition"
      :drag-disabled-reason="dragDisabledReason"
      :can-drop-on="canDropOn"
      @drag-start="(id, event) => emit('dragStart', id, event)"
      @drag-over="(payload, event) => emit('dragOver', payload, event)"
      @drag-leave="(id, event) => emit('dragLeave', id, event)"
      @drop="(payload, event) => emit('drop', payload, event)"
      @drag-end="emit('dragEnd')"
    />
  </template>
</template>
