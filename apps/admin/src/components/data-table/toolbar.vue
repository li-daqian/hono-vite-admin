<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import type { DataTableSearchField } from './types'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { X } from 'lucide-vue-next'
import { computed } from 'vue'
import DataTableFacetedFilter from './faceted-filter.vue'
import { SearchFieldType } from './types'
import DataTableViewOptions from './view-options.vue'

// 定义 Props 以接收来自 table.vue 的搜索配置和状态
const props = defineProps<{
  table: Table<TData>
  searchFields: DataTableSearchField[]
  searchState: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:searchState', value: Record<string, any>): void
  (e: 'reset'): void
}>()

// Define toolbar item height in one place
const TOOLBAR_ITEM_HEIGHT = 'h-8'

// 判断是否有任何搜索项已被填充
const hasActiveSearch = computed(() => {
  return props.searchFields.some((field) => {
    const value = props.searchState[field.key]

    if (Array.isArray(value))
      return value.length > 0

    if (value == null)
      return false

    if (typeof value === 'string')
      return value.trim().length > 0

    return Boolean(value)
  })
})

// 更新单个搜索字段的值
function updateValue(key: string, value: any) {
  const newState = { ...props.searchState, [key]: value }
  emit('update:searchState', newState)
}
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex flex-1 flex-wrap items-end gap-3">
      <div v-for="field in props.searchFields" :key="field.key" class="flex flex-col gap-1">
        <Input
          v-if="field.type === SearchFieldType.Input"
          :model-value="props.searchState[field.key]"
          :placeholder="field.placeholder ?? 'Search'"
          :class="`${TOOLBAR_ITEM_HEIGHT} w-64`"
          @update:model-value="v => updateValue(field.key, v)"
        />

        <DataTableFacetedFilter
          v-else-if="field.type === SearchFieldType.Single"
          :title="field.label ?? field.key"
          :options="field.options ?? []"
          :model-value="props.searchState[field.key]"
          :class="TOOLBAR_ITEM_HEIGHT"
          mode="single"
          @update:model-value="v => updateValue(field.key, v)"
        />

        <DataTableFacetedFilter
          v-else-if="field.type === SearchFieldType.Multi"
          :title="field.label ?? field.key"
          :options="field.options ?? []"
          :model-value="props.searchState[field.key]"
          :class="TOOLBAR_ITEM_HEIGHT"
          mode="multi"
          @update:model-value="v => updateValue(field.key, v)"
        />
      </div>

      <Button v-if="hasActiveSearch" variant="ghost" :class="`${TOOLBAR_ITEM_HEIGHT} px-2 lg:px-3`" @click="emit('reset')">
        Reset
        <X class="ms-2 h-4 w-4" />
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <DataTableViewOptions :table="props.table" />
    </div>
  </div>
</template>
