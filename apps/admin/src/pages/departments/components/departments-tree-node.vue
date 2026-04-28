<script setup lang="ts">
import type { DepartmentTreeItemSchema } from '@admin/client'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  TableCell,
  TableRow,
} from '@admin/components/ui/table'
import { cn } from '@admin/lib/utils'
import { Building2, ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'
import DepartmentsTreeNode from './departments-tree-node.vue'

defineOptions({ name: 'DepartmentsTreeNode' })

const props = defineProps<{
  node: DepartmentTreeItemSchema
  depth: number
  forceOpen?: boolean
}>()

const statusClassMap: Record<DepartmentTreeItemSchema['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

const isOpen = ref(true)
const hasChildren = computed(() => props.node.children.length > 0)
const childrenVisible = computed(() => props.forceOpen || isOpen.value)
</script>

<template>
  <TableRow class="group/row">
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

        <Building2 class="size-4 shrink-0 text-muted-foreground" />
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
    <TableCell class="bg-background group-hover/row:bg-muted text-right">
      {{ node.order }}
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
    />
  </template>
</template>
