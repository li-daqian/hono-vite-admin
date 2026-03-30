<script setup lang="ts">
import type { DataTableFilterField, FetchRequestParams } from '@admin/components/data-table'
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { UserPageItem } from './users-columns'
import { getUserPage } from '@admin/client'
import { DataTablePagination, DataTableToolbar } from '@admin/components/data-table'
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
import { computed, ref, shallowRef, watch } from 'vue'
import DataTableBulkActions from './data-table-bulk-actions.vue'
import { usersColumns } from './users-columns'
import { useUsers } from './users-provider.vue'

const props = withDefaults(defineProps<{
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const { roleOptions } = useUsers()

const filters = computed<DataTableFilterField[]>(() => [
  {
    columnId: 'status',
    title: 'Status',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Disabled', value: 'DISABLED' },
    ],
  },
  {
    columnId: 'roles',
    title: 'Roles',
    options: roleOptions.value,
  },
])

const tableData = shallowRef<UserPageItem[]>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const totalPages = ref(1)
const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const isLoading = ref(true)

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
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
  },
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  enableRowSelection: true,
  get pageCount() {
    return totalPages.value
  },
  onPaginationChange: updater => valueUpdater(updater, pagination),
  onSortingChange: (updater) => {
    valueUpdater(updater, sorting)
    pagination.value.pageIndex = 0
  },
  onColumnFiltersChange: (updater) => {
    valueUpdater(updater, columnFilters)
    pagination.value.pageIndex = 0
  },
  onRowSelectionChange: updater => valueUpdater(updater, rowSelection),
  onColumnVisibilityChange: updater => valueUpdater(updater, columnVisibility),
  getCoreRowModel: getCoreRowModel(),
})

async function fetchUsers() {
  const usernameFilter = columnFilters.value.find(filter => filter.id === 'username')?.value
  const statusFilter = columnFilters.value.find(filter => filter.id === 'status')?.value
  const rolesFilter = columnFilters.value.find(filter => filter.id === 'roles')?.value

  const query: FetchRequestParams = {
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    sort: sorting.value.map(item => `${item.id} ${item.desc ? 'desc' : 'asc'}`).join(',') || undefined,
    search: typeof usernameFilter === 'string' && usernameFilter.trim().length > 0 ? usernameFilter.trim() : undefined,
    status: Array.isArray(statusFilter) && statusFilter.length > 0 ? statusFilter : undefined,
    roleIds: Array.isArray(rolesFilter) && rolesFilter.length > 0 ? rolesFilter : undefined,
  }

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

function getColumnMetaClass(column: ReturnType<typeof table.getAllLeafColumns>[number], key: 'className' | 'thClassName' | 'tdClassName') {
  const meta = column.columnDef.meta as Record<string, string> | undefined
  return meta?.[key]
}

function handleTableMutationSuccess() {
  void fetchUsers()
}

let timer: number | undefined

watch([pagination, sorting, columnFilters], () => {
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
      search-placeholder="Filter users..."
      search-key="username"
      :filters="filters"
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
              :class="cn(
                'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                getColumnMetaClass(header.column, 'className'),
                getColumnMetaClass(header.column, 'thClassName'),
              )"
            >
              <template v-if="!header.isPlaceholder">
                <FlexRender
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
                :class="cn(
                  'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                  getColumnMetaClass(cell.column, 'className'),
                  getColumnMetaClass(cell.column, 'tdClassName'),
                )"
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
    <DataTableBulkActions :table="table" @success="handleTableMutationSuccess" />
  </div>
</template>
