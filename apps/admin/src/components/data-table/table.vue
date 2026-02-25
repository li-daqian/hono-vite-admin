<script setup lang="ts" generic="TData extends Record<string, unknown>">
import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import type { HTMLAttributes } from 'vue'
import type { DataTableColumn, DataTableOperations, DataTableSearchField } from './types'
import { client } from '@admin/client/client.gen'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
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
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { valueUpdater } from '@admin/components/ui/table/utils'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-vue-next'
import { computed, onUnmounted, ref, watch } from 'vue'
import DataTablePagination from './pagination.vue'
import { SearchFieldType } from './types'

interface PaginatedResponse<TItem> {
  items: TItem[]
  meta: {
    totalItem: number
    totalPage: number
    page: number
    pageSize: number
    sort?: string | null
  }
}

type SearchValue = string | string[] | null

interface DataTableSlots<TItem> {
  operations?: (props: { row: TItem }) => unknown
}

const props = withDefaults(defineProps<{
  requestUrl: string
  columns: DataTableColumn<TData>[]
  search?: DataTableSearchField[]
  operations?: DataTableOperations
  requestParams?: Record<string, unknown>
  pageSize?: number
  pageSizeOptions?: number[]
  class?: HTMLAttributes['class']
}>(), {
  search: () => [],
  operations: undefined,
  requestParams: () => ({}),
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 30, 40, 50],
})

const slots = defineSlots<DataTableSlots<TData>>()

const tableData = ref<TData[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const activeRequestController = ref<AbortController | null>(null)
const requestSequence = ref(0)

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: props.pageSize,
})
const totalPages = ref(1)

const columnVisibility = ref<VisibilityState>({})
const columnPinning = ref<ColumnPinningState>({})
const sorting = ref<SortingState>([])

const operationColumnId = 'operations'

const tableColumns = computed<ColumnDef<TData>[]>(() => {
  const baseColumns = props.columns.map((column) => {
    return {
      id: column.key,
      accessorKey: column.key,
      header: column.header,
      enableSorting: column.sortable === true,
      enableHiding: column.configurable !== false,
      meta: {
        title: column.header,
        configurable: column.configurable !== false,
      },
      cell: ({ row, getValue }) => {
        if (column.cell) {
          return column.cell(row.original, getValue())
        }
        return getValue()
      },
    } satisfies ColumnDef<TData>
  })

  if (slots.operations) {
    baseColumns.push({
      id: operationColumnId,
      header: props.operations?.header ?? 'Actions',
      enableSorting: false,
      enableHiding: false,
      meta: {
        title: props.operations?.header ?? 'Actions',
        configurable: false,
      },
      cell: ({ row }) => slots.operations?.({ row: row.original }) ?? null,
    })
  }

  return baseColumns
})

const defaultSearchState = computed<Record<string, SearchValue>>(() => {
  const state: Record<string, SearchValue> = {}
  for (const field of props.search) {
    if (field.type === SearchFieldType.Multi) {
      state[field.key] = Array.isArray(field.defaultValue) ? field.defaultValue : []
    }
    else {
      state[field.key] = typeof field.defaultValue === 'string' ? field.defaultValue : ''
    }
  }
  return state
})

const searchState = ref<Record<string, SearchValue>>(defaultSearchState.value)

const table = useVueTable({
  get data() {
    return tableData.value
  },
  get columns() {
    return tableColumns.value
  },
  getCoreRowModel: getCoreRowModel(),
  state: {
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnPinning() {
      return columnPinning.value
    },
    get pagination() {
      return pagination.value
    },
    get sorting() {
      return sorting.value
    },
  },
  manualPagination: true,
  manualSorting: true,
  get pageCount() {
    return totalPages.value
  },
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onColumnPinningChange: updaterOrValue => valueUpdater(updaterOrValue, columnPinning),
  onPaginationChange: handlePaginationChange,
  onSortingChange: handleSortingChange,
})

const canConfigureColumns = computed(() => {
  return table.getAllLeafColumns().some(column => column.columnDef.enableHiding !== false)
})

const canPinColumns = computed(() => {
  return table.getAllLeafColumns().length > 0
})

const sortParam = computed(() => {
  if (sorting.value.length === 0)
    return null

  return sorting.value
    .map(sort => `${sort.id} ${sort.desc ? 'desc' : 'asc'}`)
    .join(', ')
})

const hasActiveSearch = computed(() => {
  return Object.values(searchState.value).some((value) => {
    if (Array.isArray(value))
      return value.length > 0
    return value !== null && String(value).trim().length > 0
  })
})

function resetSearchState() {
  searchState.value = defaultSearchState.value
}

function getInputValue(fieldKey: string) {
  const value = searchState.value[fieldKey]
  return typeof value === 'string' ? value : ''
}

function updateInputValue(fieldKey: string, value: string | number) {
  searchState.value = {
    ...searchState.value,
    [fieldKey]: String(value),
  }
}

function getSingleValue(fieldKey: string) {
  const value = searchState.value[fieldKey]
  return typeof value === 'string' ? value : ''
}

function updateSingleValue(fieldKey: string, value: string | number | null) {
  if (value === null) {
    searchState.value = {
      ...searchState.value,
      [fieldKey]: '',
    }
    return
  }

  searchState.value = {
    ...searchState.value,
    [fieldKey]: String(value),
  }
}

function getColumnTitle(column: Column<TData>) {
  const header = column.columnDef.header
  if (typeof header === 'string')
    return header
  return column.id
}

function getPinnedStyle(column: Column<TData>) {
  const pinned = column.getIsPinned()
  if (!pinned)
    return undefined

  if (pinned === 'left') {
    return {
      left: `${column.getStart('left')}px`,
      position: 'sticky' as const,
      zIndex: 1,
      background: 'var(--card)',
    }
  }

  return {
    right: `${column.getAfter('right')}px`,
    position: 'sticky' as const,
    zIndex: 1,
    background: 'var(--card)',
  }
}

function getSortIcon(column: Column<TData>) {
  const sortState = column.getIsSorted()
  if (sortState === 'asc')
    return ArrowUp
  if (sortState === 'desc')
    return ArrowDown
  return ArrowUpDown
}

function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  const previous = pagination.value
  valueUpdater(updaterOrValue, pagination)
  const next = pagination.value

  const pageSizeChanged = previous.pageSize !== next.pageSize
  const normalizedPageSize = next.pageSize > 0
    ? next.pageSize
    : Math.max(1, previous.pageSize)
  const maxPageIndex = Math.max(totalPages.value - 1, 0)

  let normalizedPageIndex = next.pageIndex
  if (pageSizeChanged)
    normalizedPageIndex = 0

  normalizedPageIndex = Math.min(Math.max(normalizedPageIndex, 0), maxPageIndex)

  if (normalizedPageIndex !== next.pageIndex || normalizedPageSize !== next.pageSize) {
    pagination.value = {
      ...next,
      pageIndex: normalizedPageIndex,
      pageSize: normalizedPageSize,
    }
  }
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting)
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
  }
}

function buildSearchParams() {
  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(searchState.value)) {
    if (Array.isArray(value)) {
      if (value.length > 0)
        params[key] = value.join(',')
      continue
    }

    if (value === null)
      continue

    const normalized = String(value).trim()
    if (normalized.length > 0)
      params[key] = normalized
  }

  return params
}

async function fetchData() {
  const requestId = requestSequence.value + 1
  requestSequence.value = requestId

  activeRequestController.value?.abort()
  const controller = new AbortController()
  activeRequestController.value = controller

  loading.value = true
  errorMessage.value = null

  const query = {
    ...props.requestParams,
    ...buildSearchParams(),
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    sort: sortParam.value ?? undefined,
  }

  try {
    const res = await client.instance.get<PaginatedResponse<TData>>(props.requestUrl, {
      params: query,
      signal: controller.signal,
    })

    if (requestId !== requestSequence.value)
      return

    tableData.value = res.data.items
    totalPages.value = Math.max(1, res.data.meta.totalPage)
  }
  catch (error) {
    if (isRequestCanceled(error))
      return

    if (requestId !== requestSequence.value)
      return

    errorMessage.value = error instanceof Error ? error.message : 'Failed to load data.'
    tableData.value = []
    totalPages.value = 1
  }
  finally {
    if (requestId === requestSequence.value)
      loading.value = false
  }
}

function isRequestCanceled(error: unknown) {
  if (!(error instanceof Error))
    return false

  const maybeError = error as Error & { code?: string }
  return maybeError.name === 'CanceledError' || maybeError.code === 'ERR_CANCELED'
}

function pinColumn(columnId: string, position: 'left' | 'right' | false) {
  const column = table.getColumn(columnId)
  column?.pin(position)
}

function getMultiSearchLabel(field: DataTableSearchField) {
  const currentValue = searchState.value[field.key]
  if (!Array.isArray(currentValue))
    return undefined

  const selected = field.options?.filter(option => currentValue.includes(option.value)) ?? []
  if (selected.length === 0)
    return undefined

  return selected.map(option => option.label).join(', ')
}

function toggleMultiOption(fieldKey: string, optionValue: string, checked: boolean | 'indeterminate') {
  const nextValues = Array.isArray(searchState.value[fieldKey])
    ? [...(searchState.value[fieldKey] as string[])]
    : []

  const exists = nextValues.includes(optionValue)
  if (checked === true && !exists)
    nextValues.push(optionValue)
  if (checked !== true && exists)
    nextValues.splice(nextValues.indexOf(optionValue), 1)

  searchState.value = {
    ...searchState.value,
    [fieldKey]: nextValues,
  }
}

function applyColumnDefaults() {
  const visibility: VisibilityState = {}
  const pinnedLeft: string[] = []
  const pinnedRight: string[] = []

  for (const column of props.columns) {
    visibility[column.key] = column.visible !== false

    if (column.pin === 'left')
      pinnedLeft.push(column.key)
    if (column.pin === 'right')
      pinnedRight.push(column.key)
  }

  if (slots.operations && props.operations?.pin === 'left')
    pinnedLeft.push(operationColumnId)
  if (slots.operations && props.operations?.pin === 'right')
    pinnedRight.push(operationColumnId)

  columnVisibility.value = visibility
  columnPinning.value = {
    left: pinnedLeft,
    right: pinnedRight,
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => [pagination.value.pageIndex, pagination.value.pageSize, sorting.value],
  () => {
    void fetchData()
  },
  { immediate: true, deep: true },
)

watch(
  () => searchState.value,
  () => {
    if (searchTimer)
      clearTimeout(searchTimer)

    searchTimer = setTimeout(() => {
      pagination.value = {
        ...pagination.value,
        pageIndex: 0,
      }
      void fetchData()
    }, 300)
  },
  { deep: true },
)

watch(
  () => props.columns,
  () => {
    applyColumnDefaults()
  },
  { immediate: true },
)

watch(
  () => props.search,
  () => {
    resetSearchState()
  },
  { immediate: true },
)

onUnmounted(() => {
  activeRequestController.value?.abort()
  if (searchTimer)
    clearTimeout(searchTimer)
})
</script>

<template>
  <div class="space-y-4" :class="props.class">
    <div v-if="props.search.length > 0" class="flex flex-wrap items-end gap-3">
      <div v-for="field in props.search" :key="field.key" class="flex min-w-48 flex-col gap-1">
        <Label class="text-xs text-muted-foreground">
          {{ field.label ?? field.key }}
        </Label>

        <Input
          v-if="field.type === SearchFieldType.Input"
          :model-value="getInputValue(field.key)"
          :placeholder="field.placeholder ?? 'Search'"
          @update:model-value="value => updateInputValue(field.key, value)"
        />

        <Select
          v-else-if="field.type === SearchFieldType.Single"
          :model-value="getSingleValue(field.key)"
          @update:model-value="value => updateSingleValue(field.key, value)"
        >
          <SelectTrigger size="sm" class="w-full">
            <SelectValue :placeholder="field.placeholder ?? 'Select'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in field.options ?? []"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu v-else-if="field.type === SearchFieldType.Multi">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="w-full justify-between">
              <span class="line-clamp-1 text-left">
                {{ getMultiSearchLabel(field) ?? field.placeholder ?? 'Select' }}
              </span>
              <ChevronDown class="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuLabel>
              {{ field.label ?? field.key }}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="option in field.options ?? []"
              :key="option.value"
              :checked="Array.isArray(searchState[field.key]) && (searchState[field.key] as string[]).includes(option.value)"
              @update:checked="(checked: boolean | 'indeterminate') => toggleMultiOption(field.key, option.value, checked)"
            >
              {{ option.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        v-if="hasActiveSearch"
        variant="outline"
        size="sm"
        @click="resetSearchState"
      >
        Clear
      </Button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <DropdownMenu v-if="canConfigureColumns">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Show Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-52">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllLeafColumns()"
              :key="`visible-${column.id}`"
              :checked="column.getIsVisible()"
              :disabled="column.columnDef.enableHiding === false"
              @update:checked="(checked: boolean | 'indeterminate') => column.toggleVisibility(checked === true)"
            >
              {{ getColumnTitle(column) }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu v-if="canPinColumns">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Pin Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuLabel>Pin Position</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <template v-for="column in table.getAllLeafColumns()" :key="`pin-${column.id}`">
              <DropdownMenuItem @select="() => pinColumn(column.id, 'left')">
                {{ getColumnTitle(column) }} · Pin Left
              </DropdownMenuItem>
              <DropdownMenuItem @select="() => pinColumn(column.id, 'right')">
                {{ getColumnTitle(column) }} · Pin Right
              </DropdownMenuItem>
              <DropdownMenuItem @select="() => pinColumn(column.id, false)">
                {{ getColumnTitle(column) }} · Unpin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :style="getPinnedStyle(header.column)"
          >
            <template v-if="!header.isPlaceholder">
              <Button
                v-if="header.column.getCanSort()"
                variant="ghost"
                size="sm"
                class="h-8 px-2"
                @click="header.column.toggleSorting()"
              >
                <span>{{ getColumnTitle(header.column) }}</span>
                <component :is="getSortIcon(header.column)" class="ml-1 size-3.5" />
              </Button>
              <span v-else>
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </span>
            </template>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="loading">
          <TableEmpty :colspan="table.getVisibleLeafColumns().length">
            Loading data...
          </TableEmpty>
        </template>
        <template v-else-if="errorMessage">
          <TableEmpty :colspan="table.getVisibleLeafColumns().length">
            {{ errorMessage }}
          </TableEmpty>
        </template>
        <template v-else-if="table.getRowModel().rows.length === 0">
          <TableEmpty :colspan="table.getVisibleLeafColumns().length">
            No data available.
          </TableEmpty>
        </template>
        <template v-else>
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :style="getPinnedStyle(cell.column)"
            >
              <FlexRender :render="cell.column.columnDef.cell ?? cell.column.columnDef.header" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <DataTablePagination :table="table" />
  </div>
</template>
