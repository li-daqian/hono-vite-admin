<script setup lang="ts">
import type { GetUserPageResponse } from '@admin/client'
import type {
  Column,
  ColumnDef,
  ColumnOrderState,
  ColumnPinningState,
  PaginationState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import { getUserPage } from '@admin/client'
import DataTablePagination from '@admin/components/data-table/pagination.vue'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
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
import { ref } from 'vue'

type UserPageItem = GetUserPageResponse['items'][number]

const columns: ColumnDef<UserPageItem>[] = [
  {
    header: 'Username',
    accessorKey: 'username',
  },
  {
    header: 'Display Name',
    accessorKey: 'displayName',
  },
  {
    header: 'Phone',
    accessorKey: 'phone',
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Status',
    accessorKey: 'status',
  },
]

const users = ref<UserPageItem[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})
const totalPages = ref(1)

const columnVisibility = ref<VisibilityState>({})
const columnOrder = ref<ColumnOrderState>([])
const columnPinning = ref<ColumnPinningState>({})

const table = useVueTable({
  get data() {
    return users.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  state: {
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnOrder() {
      return columnOrder.value
    },
    get columnPinning() {
      return columnPinning.value
    },
    get pagination() {
      return pagination.value
    },
  },
  manualPagination: true,
  get pageCount() {
    return totalPages.value
  },
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onColumnOrderChange: updaterOrValue => valueUpdater(updaterOrValue, columnOrder),
  onColumnPinningChange: updaterOrValue => valueUpdater(updaterOrValue, columnPinning),
  onPaginationChange: handlePaginationChange,
})

function getOrderedColumnIds() {
  return table.getAllLeafColumns().map(column => column.id)
}

function moveColumn(columnId: string, direction: 'left' | 'right') {
  const source = columnOrder.value.length > 0
    ? [...columnOrder.value]
    : getOrderedColumnIds()
  const currentIndex = source.indexOf(columnId)
  if (currentIndex === -1)
    return

  const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= source.length)
    return

  const currentValue = source[currentIndex]
  const targetValue = source[targetIndex]
  if (!currentValue || !targetValue)
    return

  const nextOrder = [...source]
  nextOrder[currentIndex] = targetValue
  nextOrder[targetIndex] = currentValue

  columnOrder.value = nextOrder
}

function pinColumn(columnId: string, position: 'left' | 'right' | false) {
  const column = table.getColumn(columnId)
  column?.pin(position)
}

function getColumnTitle(column: Column<UserPageItem>) {
  const header = column.columnDef.header
  if (typeof header === 'string')
    return header
  return column.id
}

function getPinnedStyle(column: Column<UserPageItem>) {
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

async function fetchUsers() {
  loading.value = true
  errorMessage.value = null

  try {
    const res = await getUserPage<true>({
      query: {
        page: pagination.value.pageIndex + 1,
        pageSize: pagination.value.pageSize,
      },
    })

    users.value = res.data.items
    totalPages.value = Math.max(1, res.data.meta.totalPage)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load users.'
    users.value = []
    totalPages.value = 1
  }
  finally {
    loading.value = false
  }
}

function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  if (loading.value)
    return

  const previous = pagination.value
  valueUpdater(updaterOrValue, pagination)
  const next = pagination.value

  if (previous.pageIndex === next.pageIndex && previous.pageSize === next.pageSize)
    return

  if (next.pageIndex < 0)
    return

  if (next.pageIndex >= totalPages.value)
    return

  if (next.pageSize <= 0)
    return

  fetchUsers()
}

fetchUsers()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Users</CardTitle>
      <div class="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Show Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-52">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllLeafColumns()"
              :key="`visible-${column.id}`"
              :checked="column.getIsVisible()"
              @update:checked="(checked: boolean | 'indeterminate') => column.toggleVisibility(checked === true)"
            >
              {{ getColumnTitle(column) }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Pin Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
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

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Change Order
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>Column Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <template v-for="column in table.getAllLeafColumns()" :key="`order-${column.id}`">
              <DropdownMenuItem @select="() => moveColumn(column.id, 'left')">
                {{ getColumnTitle(column) }} · Move Left
              </DropdownMenuItem>
              <DropdownMenuItem @select="() => moveColumn(column.id, 'right')">
                {{ getColumnTitle(column) }} · Move Right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="getPinnedStyle(header.column)"
            >
              <template v-if="!header.isPlaceholder">
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </template>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="loading">
            <TableEmpty :colspan="table.getVisibleLeafColumns().length">
              Loading users...
            </TableEmpty>
          </template>
          <template v-else-if="errorMessage">
            <TableEmpty :colspan="table.getVisibleLeafColumns().length">
              {{ errorMessage }}
            </TableEmpty>
          </template>
          <template v-else-if="table.getRowModel().rows.length === 0">
            <TableEmpty :colspan="table.getVisibleLeafColumns().length">
              No users found.
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
    </CardContent>
  </Card>
</template>
