<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { X } from 'lucide-vue-next'
import { computed } from 'vue'
import { DataTableViewOptions } from '.'

interface FilterOption {
  label: string
  value: string
  icon?: any
}

interface FilterConfig {
  columnId: string
  title: string
  options: FilterOption[]
}

const props = withDefaults(defineProps<{
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: FilterConfig[]
}>(), {
  searchPlaceholder: 'Filter...',
  filters: () => [],
})

// 判断是否处于过滤状态
const isFiltered = computed(() => {
  const state = props.table.getState()
  return state.columnFilters.length > 0 || !!state.globalFilter
})

// 处理重置逻辑
function handleReset() {
  props.table.resetColumnFilters()
  props.table.setGlobalFilter('')
}

// 获取列搜索值
const columnFilterValue = computed({
  get: () => (props.searchKey ? props.table.getColumn(props.searchKey)?.getFilterValue() as string : '') ?? '',
  set: (val) => {
    if (props.searchKey) {
      props.table.getColumn(props.searchKey)?.setFilterValue(val)
    }
  },
})

// 获取全局搜索值
const globalFilterValue = computed({
  get: () => (props.table.getState().globalFilter as string) ?? '',
  set: val => props.table.setGlobalFilter(val),
})
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
      <Input
        v-if="props.searchKey"
        v-model="columnFilterValue"
        :placeholder="props.searchPlaceholder"
        class="h-8 w-40 lg:w-64"
      />
      <Input
        v-else
        v-model="globalFilterValue"
        :placeholder="props.searchPlaceholder"
        class="h-8 w-40 lg:w-64"
      />

      <div class="flex gap-x-2">
        <template v-for="filter in props.filters" :key="filter.columnId" />
      </div>

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="handleReset"
      >
        Reset
        <X class="ms-2 h-4 w-4" />
      </Button>
    </div>

    <DataTableViewOptions :table="props.table" />
  </div>
</template>
