<script setup lang="ts">
import type { AuditLogListItemSchema, GetAuditExportData, GetAuditPageData } from '@admin/client'
import type { DataTableFilterField } from '@admin/components/data-table'
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { getAuditExport, getAuditPage } from '@admin/client'
import { DataTableLoadingRows, DataTablePagination, DataTableToolbar } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { valueUpdater } from '@admin/components/ui/table/utils'
import { cn, formatDateTimeForFilename } from '@admin/lib/utils'
import { useAppConfigStore } from '@admin/stores/app-config'
import { useDictionaryStore } from '@admin/stores/dictionaries'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { Download, X } from 'lucide-vue-next'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import { getAuditColumns } from './audit-columns'
import AuditDateTimeRangePicker from './audit-date-time-range-picker.vue'
import AuditViewDialog from './audit-view-dialog.vue'

const props = defineProps<{
  mode: 'login' | 'operation'
}>()

const appConfig = useAppConfigStore()
const dictionaryStore = useDictionaryStore()
const isLoginMode = computed(() => props.mode === 'login')
const resultFilterOptions = [
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
]

const filters = computed<DataTableFilterField[]>(() => {
  const resultFilter = {
    columnId: 'result',
    title: 'Result',
    options: resultFilterOptions,
  }

  if (isLoginMode.value) {
    return [resultFilter]
  }

  return [
    {
      columnId: 'module',
      title: 'Module',
      options: dictionaryStore.getOptions('audit_module'),
    },
    resultFilter,
  ]
})

const searchPlaceholder = computed(() => isLoginMode.value ? 'Search login logs...' : 'Search operation logs...')

const tableData = shallowRef<AuditLogListItemSchema[]>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: appConfig.defaultPageSize })
const totalPages = ref(1)
const sorting = ref<SortingState>([{ id: 'createdAt', desc: true }])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({
  module: !isLoginMode.value,
  method: false,
  ip: false,
  requestId: false,
  userAgent: false,
})
const globalFilter = ref('')
const operatorFilter = ref('')
const createdAtFrom = ref('')
const createdAtTo = ref('')
const failureReasonFilter = ref('')
const isLoading = ref(true)
const isExporting = ref(false)
const selectedAuditId = ref<string | null>(null)
const isDetailDialogOpen = ref(false)

const hasAdvancedFilters = computed(() => {
  return Boolean(operatorFilter.value)
    || Boolean(createdAtFrom.value)
    || Boolean(createdAtTo.value)
    || Boolean(failureReasonFilter.value)
})

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

function getColumnArrayFilter(columnId: string): string[] | undefined {
  const value = columnFilters.value.find(filter => filter.id === columnId)?.value
  return Array.isArray(value) && value.length > 0 ? value as string[] : undefined
}

function getResultFilter(): Array<'success' | 'failure'> | undefined {
  const values = getColumnArrayFilter('result')?.filter((value): value is 'success' | 'failure' => {
    return value === 'success' || value === 'failure'
  })

  return values && values.length > 0 ? values : undefined
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function getBaseAuditQuery(): NonNullable<GetAuditExportData['query']> {
  return {
    sort: sorting.value.map(item => `${item.id} ${item.desc ? 'desc' : 'asc'}`).join(',') || undefined,
    search: globalFilter.value.trim() || undefined,
    operator: operatorFilter.value.trim() || undefined,
    categories: [props.mode],
    modules: !isLoginMode.value ? getColumnArrayFilter('module') : undefined,
    results: getResultFilter(),
    createdAtFrom: toIsoDateTime(createdAtFrom.value),
    createdAtTo: toIsoDateTime(createdAtTo.value),
    failureReason: failureReasonFilter.value.trim() || undefined,
  }
}

function getExportDateTimeQuery() {
  return {
    exportLocale: navigator.language || undefined,
    exportTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  }
}

async function fetchAuditLogs() {
  isLoading.value = true

  const query: GetAuditPageData['query'] = {
    ...getBaseAuditQuery(),
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
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

function resetAdvancedFilters() {
  operatorFilter.value = ''
  createdAtFrom.value = ''
  createdAtTo.value = ''
  failureReasonFilter.value = ''
  pagination.value.pageIndex = 0
}

function getExportFilename(timeZone?: string) {
  const prefix = isLoginMode.value ? 'login-logs' : 'operation-logs'
  return `${prefix}-${formatDateTimeForFilename(new Date(), timeZone)}.csv`
}

function downloadCsv(content: string, timeZone?: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = getExportFilename(timeZone)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function handleExport() {
  isExporting.value = true

  try {
    const exportDateTimeQuery = getExportDateTimeQuery()
    const response = await getAuditExport<true>({
      query: {
        ...getBaseAuditQuery(),
        ...exportDateTimeQuery,
        limit: 5000,
      },
    })
    downloadCsv(String(response.data ?? ''), exportDateTimeQuery.exportTimeZone)
  }
  catch {
    toast.error('Failed to export audit logs.')
  }
  finally {
    isExporting.value = false
  }
}

function getColumnMetaClass(column: ReturnType<typeof table.getAllLeafColumns>[number], key: 'className' | 'thClassName' | 'tdClassName') {
  const meta = column.columnDef.meta as Record<string, string> | undefined
  return meta?.[key]
}

let timer: number | undefined

watch([pagination, sorting, columnFilters, globalFilter, operatorFilter, createdAtFrom, createdAtTo, failureReasonFilter], () => {
  if (timer) {
    window.clearTimeout(timer)
  }

  timer = window.setTimeout(() => {
    void fetchAuditLogs()
  }, 300)
}, { deep: true, immediate: true })

onMounted(() => {
  void dictionaryStore.fetchType('audit_module')
})
</script>

<template>
  <div
    :class="cn(
      'max-sm:has-[div[role=toolbar]]:mb-16',
      'flex min-w-0 flex-1 flex-col gap-4',
    )"
  >
    <DataTableToolbar
      :table="table"
      :search-placeholder="searchPlaceholder"
      :filters="filters"
    />

    <div class="flex min-w-0 flex-wrap items-end gap-2">
      <div class="grid gap-1.5">
        <Label :for="`audit-${props.mode}-operator`" class="text-xs text-muted-foreground">
          Operator
        </Label>
        <Input
          :id="`audit-${props.mode}-operator`"
          v-model="operatorFilter"
          placeholder="Username or name"
          class="h-8 w-44"
        />
      </div>

      <div class="grid gap-1.5">
        <Label :for="`audit-${props.mode}-time-range`" class="text-xs text-muted-foreground">
          Time Range
        </Label>
        <AuditDateTimeRangePicker
          :id="`audit-${props.mode}-time-range`"
          v-model:start-value="createdAtFrom"
          v-model:end-value="createdAtTo"
        />
      </div>

      <div class="grid gap-1.5">
        <Label :for="`audit-${props.mode}-failure-reason`" class="text-xs text-muted-foreground">
          Failure Reason
        </Label>
        <Input
          :id="`audit-${props.mode}-failure-reason`"
          v-model="failureReasonFilter"
          placeholder="Error message"
          class="h-8 w-48"
        />
      </div>

      <Button
        v-if="hasAdvancedFilters"
        type="button"
        variant="ghost"
        size="sm"
        class="h-8"
        @click="resetAdvancedFilters"
      >
        Clear
        <X class="size-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        class="ms-auto h-8"
        :disabled="isExporting"
        @click="handleExport"
      >
        <Download class="size-4" />
        {{ isExporting ? 'Exporting...' : 'Export' }}
      </Button>
    </div>

    <div class="min-w-0 overflow-hidden rounded-md border">
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
          <DataTableLoadingRows
            v-if="isLoading"
            :column-count="table.getVisibleLeafColumns().length"
          />

          <template v-else-if="table.getRowModel().rows.length">
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
            <TableCell :colspan="table.getVisibleLeafColumns().length" class="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" class="mt-auto" />
    <AuditViewDialog :id="selectedAuditId" v-model:open="isDetailDialogOpen" />
  </div>
</template>
