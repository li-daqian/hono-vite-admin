<script setup lang="ts">
import type { RowSelectionState, SortingState } from '@tanstack/vue-table'
import type { RoleItem } from './roles-columns'
import { getRole } from '@admin/client'
import { DataTableLoadingRows } from '@admin/components/data-table'
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
import { FlexRender, getCoreRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import { ref, watch } from 'vue'
import RolesBulkActions from './roles-bulk-actions.vue'
import { rolesColumns } from './roles-columns'

const props = withDefaults(defineProps<{
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const tableData = ref<RoleItem[]>([])
const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})
const isLoading = ref(true)

const table = useVueTable({
  get data() {
    return tableData.value
  },
  get columns() {
    return rolesColumns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  enableRowSelection: true,
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onRowSelectionChange: updater => valueUpdater(updater, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

async function fetchRoles() {
  isLoading.value = true
  try {
    const response = await getRole<true>()
    tableData.value = response.data
    rowSelection.value = {}
  }
  catch {
    tableData.value = []
  }
  finally {
    isLoading.value = false
  }
}

function getColumnMetaClass(column: ReturnType<typeof table.getAllLeafColumns>[number], key: 'className' | 'thClassName' | 'tdClassName') {
  const meta = column.columnDef.meta as Record<string, string> | undefined
  return meta?.[key]
}

watch(() => props.refreshKey, () => {
  void fetchRoles()
}, { immediate: true })
</script>

<template>
  <div class="max-sm:has-[div[role=toolbar]]:mb-16 flex flex-1 flex-col gap-4">
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
          <DataTableLoadingRows
            v-if="isLoading"
            :column-count="table.getVisibleLeafColumns().length"
          />

          <template v-else-if="table.getRowModel().rows.length">
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
            <TableCell :colspan="rolesColumns.length" class="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <RolesBulkActions :table="table" @success="fetchRoles" />
  </div>
</template>
