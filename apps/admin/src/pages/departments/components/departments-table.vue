<script setup lang="ts">
import type { DepartmentTreeItemSchema, PatchDepartmentReorderData } from '@admin/client'
import { patchDepartmentReorder } from '@admin/client'
import { DataTableLoadingRows } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { usePageActionPermissions } from '@admin/lib/permissions'
import { Search, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { countDepartmentTree, filterDepartmentTree, findDepartmentSiblingContext } from './department-utils'
import { useDepartments } from './departments-provider.vue'
import DepartmentsTreeNode from './departments-tree-node.vue'

type DropPosition = 'before' | 'after'
interface DropPayload {
  id: string
  position: DropPosition
}
type ReorderItem = PatchDepartmentReorderData['body']['items'][number]

const props = withDefaults(defineProps<{
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const { departmentTree, refreshDepartments, isLoadingDepartments } = useDepartments()
const search = ref('')
const status = ref<'ALL' | DepartmentTreeItemSchema['status']>('ALL')
const draggedDepartmentId = ref<string | null>(null)
const dropTarget = ref<DropPayload | null>(null)
const isReordering = ref(false)
const permissions = usePageActionPermissions()
const editPermission = computed(() => permissions.resolve('edit', { subject: 'departments' }))

const hasFilters = computed(() => search.value.trim().length > 0 || status.value !== 'ALL')
const canReorderDepartments = computed(() => editPermission.value.allowed && !hasFilters.value && !isReordering.value)

const filteredTree = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return filterDepartmentTree(departmentTree.value, (department) => {
    const matchesSearch = !keyword
      || department.name.toLowerCase().includes(keyword)
      || (department.leader?.toLowerCase().includes(keyword) ?? false)
      || (department.email?.toLowerCase().includes(keyword) ?? false)

    const matchesStatus = status.value === 'ALL' || department.status === status.value
    return matchesSearch && matchesStatus
  })
})
const visibleNodeCount = computed(() => countDepartmentTree(filteredTree.value))

function clearFilters() {
  search.value = ''
  status.value = 'ALL'
}

function canDropOnNode(node: DepartmentTreeItemSchema) {
  if (!canReorderDepartments.value || !draggedDepartmentId.value || draggedDepartmentId.value === node.id) {
    return false
  }

  const sourceContext = findDepartmentSiblingContext(departmentTree.value, draggedDepartmentId.value)
  const targetContext = findDepartmentSiblingContext(departmentTree.value, node.id)
  return Boolean(sourceContext && targetContext && sourceContext.parentId === targetContext.parentId)
}

function applySiblingOrder(siblings: DepartmentTreeItemSchema[]) {
  return siblings.map((department, index) => ({
    ...department,
    order: index + 1,
  }))
}

function replaceDepartmentSiblings(
  departments: DepartmentTreeItemSchema[],
  parentId: string | null,
  siblings: DepartmentTreeItemSchema[],
): DepartmentTreeItemSchema[] {
  if (!parentId) {
    return siblings
  }

  return departments.map((department) => {
    if (department.id === parentId) {
      return {
        ...department,
        children: siblings,
      }
    }

    return {
      ...department,
      children: replaceDepartmentSiblings(department.children, parentId, siblings),
    }
  })
}

function buildReorderedSiblings(sourceId: string, targetId: string, position: DropPosition) {
  const sourceContext = findDepartmentSiblingContext(departmentTree.value, sourceId)
  const targetContext = findDepartmentSiblingContext(departmentTree.value, targetId)

  if (!sourceContext || !targetContext || sourceContext.parentId !== targetContext.parentId) {
    return null
  }

  const nextSiblings = [...sourceContext.siblings]
  const [movedDepartment] = nextSiblings.splice(sourceContext.index, 1)
  if (!movedDepartment) {
    return null
  }

  let insertIndex = targetContext.index + (position === 'after' ? 1 : 0)
  if (sourceContext.index < insertIndex) {
    insertIndex -= 1
  }

  nextSiblings.splice(insertIndex, 0, movedDepartment)

  return {
    parentId: sourceContext.parentId,
    previousSiblings: sourceContext.siblings,
    nextSiblings: applySiblingOrder(nextSiblings),
  }
}

function handleDragStart(departmentId: string) {
  if (!canReorderDepartments.value) {
    return
  }

  draggedDepartmentId.value = departmentId
}

function handleDragOver(payload: DropPayload) {
  const targetContext = findDepartmentSiblingContext(departmentTree.value, payload.id)
  if (!targetContext || !canDropOnNode(targetContext.department)) {
    dropTarget.value = null
    return
  }

  dropTarget.value = payload
}

function handleDragLeave(departmentId: string) {
  if (dropTarget.value?.id === departmentId) {
    dropTarget.value = null
  }
}

function handleDragEnd() {
  draggedDepartmentId.value = null
  dropTarget.value = null
}

async function handleDrop(payload: DropPayload) {
  const sourceId = draggedDepartmentId.value
  if (!sourceId) {
    handleDragEnd()
    return
  }

  const reorderResult = buildReorderedSiblings(sourceId, payload.id, payload.position)
  if (!reorderResult) {
    toast.info('Departments can only be reordered within the same parent.')
    handleDragEnd()
    return
  }

  const items = reorderResult.nextSiblings
    .map((department): ReorderItem => ({
      id: department.id,
      order: department.order,
    }))
    .filter((item) => {
      const previousDepartment = reorderResult.previousSiblings.find(department => department.id === item.id)
      return previousDepartment?.order !== item.order
    })

  if (items.length === 0) {
    handleDragEnd()
    return
  }

  const previousTree = departmentTree.value
  departmentTree.value = replaceDepartmentSiblings(departmentTree.value, reorderResult.parentId, reorderResult.nextSiblings)
  isReordering.value = true

  try {
    await patchDepartmentReorder<true>({ body: { items } })
    toast.success('Department order updated.')
    await refreshDepartments()
  }
  catch {
    departmentTree.value = previousTree
    toast.error('Failed to update department order.')
  }
  finally {
    isReordering.value = false
    handleDragEnd()
  }
}

watch(() => props.refreshKey, () => {
  void refreshDepartments()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div class="relative w-full sm:max-w-xs">
          <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input v-model="search" class="h-9 pl-8" placeholder="Filter departments..." />
        </div>

        <Select v-model="status">
          <SelectTrigger class="h-9 w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              All status
            </SelectItem>
            <SelectItem value="ACTIVE">
              Active
            </SelectItem>
            <SelectItem value="DISABLED">
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>

        <Button v-if="search || status !== 'ALL'" variant="ghost" size="sm" class="h-9 px-2" @click="clearFilters">
          Reset
          <X class="ms-1 size-4" />
        </Button>
      </div>
    </div>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow class="group/row">
            <TableHead class="bg-background group-hover/row:bg-muted w-10">
              <span class="sr-only">Sort</span>
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Name
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Leader
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Contact
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Status
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted text-right">
              Users
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted text-right" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <DataTableLoadingRows v-if="isLoadingDepartments" :column-count="7" />

          <template v-else-if="visibleNodeCount > 0">
            <DepartmentsTreeNode
              v-for="department in filteredTree"
              :key="department.id"
              :node="department"
              :depth="0"
              :force-open="hasFilters"
              :can-drag="canReorderDepartments"
              :dragging-id="draggedDepartmentId"
              :drop-target-id="dropTarget?.id ?? null"
              :drop-position="dropTarget?.position ?? null"
              :can-drop-on="canDropOnNode"
              @drag-start="handleDragStart"
              @drag-over="handleDragOver"
              @drag-leave="handleDragLeave"
              @drop="handleDrop"
              @drag-end="handleDragEnd"
            />
          </template>

          <TableRow v-else>
            <TableCell :colspan="7" class="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
