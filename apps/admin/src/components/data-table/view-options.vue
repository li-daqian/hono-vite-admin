<script setup lang="ts" generic="TData">
import type { Column, Table } from '@tanstack/vue-table'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu'
import { Settings2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  table: Table<TData>
}>()

// 过滤掉不可隐藏的列，并确保是具有数据属性的列
const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter(
      column =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    ),
)

function getColumnTitle(column: Column<TData, unknown>) {
  return column.columnDef.header
}
</script>

<template>
  <DropdownMenu :modal="false">
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="ms-auto hidden h-8 lg:flex"
      >
        <Settings2 class="mr-2 size-4" />
        View
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        class="capitalize"
        :checked="column.getIsVisible()"
        @update:checked="(value: any) => column.toggleVisibility(!!value)"
      >
        {{ getColumnTitle(column) }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
