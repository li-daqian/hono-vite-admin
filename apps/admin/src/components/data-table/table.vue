<script setup lang="ts" generic="TData extends Record<string, unknown>">
import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { DataTableColumn, DataTableOperations, DataTableSearchField, FetchRequest } from './types'
import { Button } from '@admin/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { valueUpdater } from '@admin/components/ui/table/utils'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next'

import { computed, ref, shallowRef, watch } from 'vue'
import DataTablePagination from './pagination.vue'
import DataTableToolbar from './toolbar.vue'
import { SearchFieldType } from './types'

// Props 定义
const props = withDefaults(defineProps<{
  request: FetchRequest<TData>
  columns: DataTableColumn<TData>[]
  search?: DataTableSearchField[]
  operations?: DataTableOperations
  requestParams?: Record<string, unknown>
  pageSize?: number
}>(), {
  search: () => [],
  requestParams: () => ({}),
  pageSize: 10,
})

const slots = defineSlots<{ operations?: (props: { row: TData }) => any }>()

// 状态管理
const tableData = shallowRef<TData[]>([])
const loading = ref(false)
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: props.pageSize })
const totalPages = ref(1)
const columnVisibility = ref<VisibilityState>({})
const columnPinning = ref<ColumnPinningState>({})
const sorting = ref<SortingState>([])

// 搜索状态初始化
const searchState = ref<Record<string, any>>({})

watch(() => props.search, (fields) => {
  const state: Record<string, any> = {}
  fields.forEach((f) => {
    state[f.key] = f.type === SearchFieldType.Multi ? (f.defaultValue ?? []) : (f.defaultValue ?? '')
  })
  searchState.value = state
}, { immediate: true })

// 转换列定义
const tableColumns = computed<ColumnDef<TData>[]>(() => {
  const cols = props.columns.map(c => ({
    id: c.key,
    accessorKey: c.key,
    header: c.header,
    enableSorting: c.sortable === true,
    enableHiding: c.configurable !== false,
    cell: ({ row, getValue }) => c.cell ? c.cell(row.original, getValue()) : getValue(),
  } satisfies ColumnDef<TData>))

  if (slots.operations) {
    cols.push({
      id: 'actions',
      header: '',
      enableHiding: false,
      cell: ({ row }: { row: Row<TData> }) => slots.operations?.({ row: row.original }),
    } as any)
  }
  return cols
})

// TanStack Table 实例
const table = useVueTable({
  get data() { return tableData.value },
  get columns() { return tableColumns.value },
  state: {
    get pagination() { return pagination.value },
    get sorting() { return sorting.value },
    get columnVisibility() { return columnVisibility.value },
    get columnPinning() { return columnPinning.value },
  },
  manualPagination: true,
  manualSorting: true,
  get pageCount() { return totalPages.value },
  onPaginationChange: updater => valueUpdater(updater, pagination),
  onSortingChange: (updater) => {
    valueUpdater(updater, sorting)
    pagination.value.pageIndex = 0
  },
  onColumnVisibilityChange: updater => valueUpdater(updater, columnVisibility),
  onColumnPinningChange: updater => valueUpdater(updater, columnPinning),
  getCoreRowModel: getCoreRowModel(),
})

// 数据获取逻辑
async function fetchData() {
  loading.value = true
  const query = {
    ...props.requestParams,
    ...searchState.value, // 这里的逻辑可以根据你的 buildSearchParams 进一步细化
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    sort: sorting.value.map(s => `${s.id} ${s.desc ? 'desc' : 'asc'}`).join(',') || undefined,
  }
  try {
    const res = await props.request(query)
    tableData.value = res.items
    totalPages.value = res.meta.totalPage
  }
  catch {
    tableData.value = []
  }
  finally {
    loading.value = false
  }
}

// 监听触发刷新
let timer: any
watch([pagination, sorting, searchState], () => {
  clearTimeout(timer)
  timer = setTimeout(fetchData, 300)
}, { deep: true, immediate: true })

// 辅助函数
function getSortIcon(column: Column<TData>) {
  const s = column.getIsSorted()
  return s === 'asc' ? ArrowUp : s === 'desc' ? ArrowDown : ArrowUpDown
}

function getPinnedStyle(column: Column<TData>): any {
  const pinned = column.getIsPinned()
  if (!pinned)
    return undefined
  return {
    position: 'sticky',
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: 1,
    background: 'hsl(var(--background))',
  }
}
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar
      v-model:search-state="searchState"
      :table="table"
      :search-fields="props.search"
      @reset="() => (pagination.pageIndex = 0)"
    />

    <div class="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="getPinnedStyle(header.column)"
            >
              <Button
                v-if="header.column.getCanSort()"
                variant="ghost"
                size="sm"
                class="-ml-3 h-8"
                @click="header.column.toggleSorting()"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <component :is="getSortIcon(header.column)" class="ml-2 size-4" />
              </Button>
              <FlexRender v-else :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="loading">
            <TableEmpty :colspan="tableColumns.length">
              Loading...
            </TableEmpty>
          </template>
          <template v-else-if="table.getRowModel().rows.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :style="getPinnedStyle(cell.column)"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableEmpty :colspan="tableColumns.length">
              No results.
            </TableEmpty>
          </template>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" />
  </div>
</template>
