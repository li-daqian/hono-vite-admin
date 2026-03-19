<script setup lang="ts">
import type { DataTableSearchField, FetchRequestParams } from '@admin/components/data-table'
import type {
  ColumnPinningState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { UserPageItem } from './users-columns'
import { getUserPage } from '@admin/client'
import { DataTablePagination, DataTableToolbar, SearchFieldType } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { valueUpdater } from '@admin/components/ui/table/utils'
import { cn } from '@admin/lib/utils'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next'
import { ref, shallowRef, watch } from 'vue'
import DataTableBulkActions from './data-table-bulk-actions.vue'
import { usersColumns } from './users-columns'

const props = withDefaults(defineProps<{
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const searchFields: DataTableSearchField[] = [
  {
    key: 'search',
    type: SearchFieldType.Input,
    label: 'Search',
    placeholder: 'Username, email, display name',
  },
  {
    key: 'status',
    type: SearchFieldType.Multi,
    label: 'Status',
    placeholder: 'All',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Disabled', value: 'DISABLED' },
    ],
  },
]

const tableData = shallowRef<UserPageItem[]>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const totalPages = ref(1)
const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})
const columnVisibility = ref<VisibilityState>({})
const columnPinning = ref<ColumnPinningState>({
  left: ['select', 'username'],
  right: ['actions'],
})
const searchState = ref<Record<string, string | string[]>>({
  search: '',
  status: [],
})
const isLoading = ref(false)

const table = useVueTable({
  get data() {
    return tableData.value
  },
  get columns() {
    return usersColumns
  },
  state: {
    get pagination() {
      return pagination.value
    },
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnPinning() {
      return columnPinning.value
    },
  },
  manualPagination: true,
  manualSorting: true,
  enableRowSelection: true,
  get pageCount() {
    return totalPages.value
  },
  onPaginationChange: updater => valueUpdater(updater, pagination),
  onSortingChange: (updater) => {
    valueUpdater(updater, sorting)
    pagination.value.pageIndex = 0
  },
  onRowSelectionChange: updater => valueUpdater(updater, rowSelection),
  onColumnVisibilityChange: updater => valueUpdater(updater, columnVisibility),
  onColumnPinningChange: updater => valueUpdater(updater, columnPinning),
  getCoreRowModel: getCoreRowModel(),
})

async function fetchUsers() {
  const query: FetchRequestParams = {
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    sort: sorting.value.map(item => `${item.id} ${item.desc ? 'desc' : 'asc'}`).join(',') || undefined,
    search: searchState.value.search || undefined,
    status: (searchState.value.status as string[]).length > 0 ? searchState.value.status : undefined,
  }

  isLoading.value = true

  try {
    const response = await getUserPage<true>({ query })
    tableData.value = response.data.items
    totalPages.value = Math.max(response.data.meta.totalPage, 1)
    rowSelection.value = {}

    if (pagination.value.pageIndex >= response.data.meta.totalPage && response.data.meta.totalPage > 0) {
      pagination.value.pageIndex = response.data.meta.totalPage - 1
    }
  }
  catch {
    tableData.value = []
    totalPages.value = 1
  }
  finally {
    isLoading.value = false
  }
}

function updateSearchState(nextState: Record<string, any>) {
  searchState.value = nextState
  pagination.value.pageIndex = 0
}

function resetSearch() {
  searchState.value = {
    search: '',
    status: [],
  }
  pagination.value.pageIndex = 0
}

function getPinnedStyle(column: ReturnType<typeof table.getAllLeafColumns>[number]) {
  const pinned = column.getIsPinned()
  if (!pinned) {
    return undefined
  }

  return {
    position: 'sticky',
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: 1,
    background: 'hsl(var(--background))',
  }
}

function getSortIcon(column: ReturnType<typeof table.getAllLeafColumns>[number]) {
  const sorted = column.getIsSorted()
  return sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
}

let timer: number | undefined

watch([pagination, sorting, searchState], () => {
  if (timer) {
    window.clearTimeout(timer)
  }

  timer = window.setTimeout(() => {
    void fetchUsers()
  }, 300)
}, { deep: true, immediate: true })

watch(() => props.refreshKey, () => {
  void fetchUsers()
})
</script>

<template>
  <div
    :class="cn(
      'max-sm:has-[div[role=toolbar]]:mb-16',
      'flex flex-1 flex-col gap-4',
    )"
  >
    <DataTableToolbar
      :table="table"
      :search-fields="searchFields"
      :search-state="searchState"
      @update:search-state="updateSearchState"
      @reset="resetSearch"
    />

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="group/row"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="getPinnedStyle(header.column)"
              :class="cn('bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted')"
            >
              <template v-if="!header.isPlaceholder">
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
                <FlexRender
                  v-else
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </template>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              class="group/row"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :style="getPinnedStyle(cell.column)"
                :class="cn('bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted')"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="usersColumns.length" class="h-24 text-center text-muted-foreground">
              {{ isLoading ? 'Loading users...' : 'No results.' }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" class="mt-auto" />
    <DataTableBulkActions :table="table" />
  </div>
</template>
