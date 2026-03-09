<script setup lang="ts" generic="TData extends Record<string, unknown>">
import type { Column, Table as TanstackTable } from '@tanstack/vue-table'
import { Button } from '@admin/components/ui/button'
import { TableHead, TableHeader, TableRow } from '@admin/components/ui/table'
import { FlexRender } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next'

const props = defineProps<{
  table: TanstackTable<TData>
  getPinnedStyle: (column: Column<TData>) => Record<string, string | number> | undefined
}>()

function getSortIcon(column: Column<TData>) {
  const sorted = column.getIsSorted()
  return sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
}
</script>

<template>
  <TableHeader>
    <TableRow v-for="headerGroup in props.table.getHeaderGroups()" :key="headerGroup.id">
      <TableHead
        v-for="header in headerGroup.headers"
        :key="header.id"
        :style="props.getPinnedStyle(header.column)"
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
</template>
