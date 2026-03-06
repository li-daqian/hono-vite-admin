<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import type { DataTableSearchField } from './types'
import { Button } from '@admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { ChevronDown, X } from 'lucide-vue-next'
import { computed } from 'vue'
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

// 判断是否有任何搜索项已被填充
const hasActiveSearch = computed(() => {
  return Object.values(props.searchState).some((value) => {
    if (Array.isArray(value))
      return value.length > 0
    return value !== null && String(value).trim().length > 0
  })
})

// 更新单个搜索字段的值
function updateValue(key: string, value: any) {
  const newState = { ...props.searchState, [key]: value }
  emit('update:searchState', newState)
}

// Multi Select 专用逻辑：获取显示的标签
function getMultiSearchLabel(field: DataTableSearchField) {
  const currentValue = props.searchState[field.key]
  if (!Array.isArray(currentValue))
    return undefined
  const selected = field.options?.filter(opt => currentValue.includes(opt.value)) ?? []
  return selected.length > 0 ? selected.map(opt => opt.label).join(', ') : undefined
}

// Multi Select 专用逻辑：切换选项
function toggleMultiOption(fieldKey: string, optionValue: string, checked: boolean | 'indeterminate') {
  const nextValues = Array.isArray(props.searchState[fieldKey])
    ? [...props.searchState[fieldKey]]
    : []

  if (checked === true) {
    if (!nextValues.includes(optionValue))
      nextValues.push(optionValue)
  }
  else {
    const index = nextValues.indexOf(optionValue)
    if (index > -1)
      nextValues.splice(index, 1)
  }
  updateValue(fieldKey, nextValues)
}
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex flex-1 flex-wrap items-end gap-3">
      <div v-for="field in props.searchFields" :key="field.key" class="flex min-w-48 flex-col gap-1">
        <Label class="text-xs text-muted-foreground">{{ field.label ?? field.key }}</Label>

        <Input
          v-if="field.type === SearchFieldType.Input"
          :model-value="props.searchState[field.key]"
          :placeholder="field.placeholder ?? 'Search'"
          class="h-9"
          @update:model-value="v => updateValue(field.key, v)"
        />

        <Select
          v-else-if="field.type === SearchFieldType.Single"
          :model-value="String(props.searchState[field.key] ?? '')"
          @update:model-value="v => updateValue(field.key, v)"
        >
          <SelectTrigger class="h-9 w-full">
            <SelectValue :placeholder="field.placeholder ?? 'Select'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in field.options ?? []" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu v-else-if="field.type === SearchFieldType.Multi">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 w-full justify-between">
              <span class="line-clamp-1 text-left">
                {{ getMultiSearchLabel(field) ?? field.placeholder ?? 'Select' }}
              </span>
              <ChevronDown class="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuLabel>{{ field.label ?? field.key }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="opt in field.options ?? []"
              :key="opt.value"
              :checked="Array.isArray(props.searchState[field.key]) && props.searchState[field.key].includes(opt.value)"
              @update:checked="(c: any) => toggleMultiOption(field.key, opt.value, c)"
            >
              {{ opt.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button v-if="hasActiveSearch" variant="ghost" class="h-9 px-2 lg:px-3" @click="emit('reset')">
        Clear
        <X class="ms-2 h-4 w-4" />
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <DataTableViewOptions :table="props.table" />
    </div>
  </div>
</template>
