<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import type { DataTableFilterField } from './types'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { X } from 'lucide-vue-next'
import { computed } from 'vue'
import DataTableFacetedFilter from './faceted-filter.vue'
import DataTableViewOptions from './view-options.vue'

const props = defineProps<{
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: DataTableFilterField[]
}>()

const filters = computed(() => props.filters ?? [])

const hasActiveSearch = computed(() => {
  return props.table.getState().columnFilters.length > 0 || Boolean(props.table.getState().globalFilter)
})

function resetFilters() {
  props.table.resetColumnFilters()
  props.table.setGlobalFilter('')
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
      <Input
        v-if="props.searchKey"
        :placeholder="props.searchPlaceholder ?? 'Filter...'"
        :model-value="(props.table.getColumn(props.searchKey)?.getFilterValue() as string) ?? ''"
        class="h-8 w-37.5 lg:w-62.5"
        @update:model-value="value => props.table.getColumn(props.searchKey!)?.setFilterValue(value)"
      />

      <Input
        v-else
        :placeholder="props.searchPlaceholder ?? 'Filter...'"
        :model-value="(props.table.getState().globalFilter as string) ?? ''"
        class="h-8 w-37.5 lg:w-62.5"
        @update:model-value="value => props.table.setGlobalFilter(value)"
      />

      <div class="flex gap-x-2">
        <template v-for="filter in filters" :key="filter.columnId">
          <DataTableFacetedFilter
            v-if="props.table.getColumn(filter.columnId)"
            :column="props.table.getColumn(filter.columnId)"
            :title="filter.title"
            :options="filter.options"
          />
        </template>
      </div>

      <Button v-if="hasActiveSearch" variant="ghost" class="h-8 px-2 lg:px-3" @click="resetFilters">
        Reset
        <X class="ms-2 h-4 w-4" />
      </Button>
    </div>

    <DataTableViewOptions :table="props.table" />
  </div>
</template>
