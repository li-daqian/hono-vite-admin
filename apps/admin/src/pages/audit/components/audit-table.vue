<script setup lang="ts">
import type { AuditLogListItemSchema } from '@admin/client'
import type { DataTableFilterField, FetchRequestParams } from '@admin/components/data-table'
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { getAuditPage } from '@admin/client'
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
import { getAuditColumns } from './audit-columns'
import AuditViewDialog from './audit-view-dialog.vue'

const filters = computed<DataTableFilterField[]>(() => [
  {
    columnId: 'module',
    title: 'Module',
    options: [
      { label: 'User', value: 'user' },
      { label: 'Role', value: 'role' },
    ],
  },
])

const tableData = shallowRef<AuditLogListItemSchema[]>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const totalPages = ref(1)
const sorting = ref<SortingState>([{ id: 'createdAt', desc: true }])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({
  method: false,
  ip: false,
  requestId: false,
  userAgent: false,
})
const globalFilter = ref('')
const isLoading = ref(true)
const selectedAuditId = ref<string | null>(null)
const isDetailDialogOpen = ref(false)

function handleView(row: AuditLogListItemSchema) {
  selectedAuditId.value = row.id
  isDetailDialogOpen.value = true
}

const columns = computed(() => getAuditColumns(handleView))

const table = useVueTable({
  get data() {
    return tableData.value
  },
  get columns() {
    return columns.value
  },
  state: {
    get pagination() {
      return pagination.value
    },
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get globalFilter() {
      return globalFilter.value
    },
  },
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
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
  onColumnVisibilityChange: updater => valueUpdater(updater, columnVisibility),
  onGlobalFilterChange: (updater) => {
    valueUpdater(updater, globalFilter)
    pagination.value.pageIndex = 0
  },
  getCoreRowModel: getCoreRowModel(),
})

async function fetchAuditLogs() {
  const modulesFilter = columnFilters.value.find(filter => filter.id === 'module')?.value

  const query: FetchRequestParams = {
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    sort: sorting.value.map(item => `${item.id} ${item.desc ? 'desc' : 'asc'}`).join(',') || undefined,
    search: globalFilter.value.trim() || undefined,
    modules: Array.isArray(modulesFilter) && modulesFilter.length > 0 ? modulesFilter : undefined,
  }

  try {
    const response = await getAuditPage<true>({ query })
    tableData.value = response.data.items
    totalPages.value = Math.max(response.data.meta.totalPage, 1)

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

let timer: number | undefined

watch([pagination, sorting, columnFilters, globalFilter], () => {
  if (timer) {
    window.clearTimeout(timer)
  }

  timer = window.setTimeout(() => {
    void fetchAuditLogs()
  }, 300)
}, { deep: true, immediate: true })
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
      search-placeholder="Search audit logs..."
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
                'bg-background group-hover/row:bg-muted',
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
              class="group/row"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="cn(
                  'bg-background group-hover/row:bg-muted',
                  getColumnMetaClass(cell.column, 'className'),
                  getColumnMetaClass(cell.column, 'tdClassName'),
                )"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center text-muted-foreground">
              {{ isLoading ? 'Loading audit logs...' : 'No results.' }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" class="mt-auto" />
    <AuditViewDialog :id="selectedAuditId" v-model:open="isDetailDialogOpen" />
  </div>
</template>
