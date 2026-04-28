<script setup lang="ts">
import type { DepartmentTreeItemSchema } from '@admin/client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { cn } from '@admin/lib/utils'
import { Check, ChevronDown, Search } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import DepartmentTreeSelectNode from './department-tree-select-node.vue'
import {
  filterDepartmentTree,
  findDepartmentById,
  omitDepartmentTree,
} from './department-utils'

const props = withDefaults(defineProps<{
  departments: DepartmentTreeItemSchema[]
  placeholder?: string
  searchPlaceholder?: string
  emptyValue?: string
  emptyLabel?: string
  excludeIds?: string[]
}>(), {
  placeholder: 'Select department',
  searchPlaceholder: 'Search department',
  emptyLabel: 'No department',
})

const modelValue = defineModel<string>({ default: '' })

const open = ref(false)
const searchTerm = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const excludedIds = computed(() => new Set(props.excludeIds ?? []))
const availableDepartments = computed(() => omitDepartmentTree(props.departments, excludedIds.value))

const visibleDepartments = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return availableDepartments.value
  }

  return filterDepartmentTree(availableDepartments.value, (department) => {
    return department.name.toLowerCase().includes(keyword)
      || (department.leader?.toLowerCase().includes(keyword) ?? false)
      || (department.email?.toLowerCase().includes(keyword) ?? false)
  })
})

const selectedDepartment = computed(() => findDepartmentById(props.departments, modelValue.value))
const isEmptySelected = computed(() => props.emptyValue !== undefined && modelValue.value === props.emptyValue)
const selectedLabel = computed(() => {
  if (isEmptySelected.value) {
    return props.emptyLabel
  }

  return selectedDepartment.value?.name
})

function selectValue(value: string) {
  modelValue.value = value
  searchTerm.value = ''
  open.value = false
}

watch(open, async (value) => {
  if (!value) {
    searchTerm.value = ''
    return
  }

  await nextTick()
  searchInputRef.value?.focus()
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :class="cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          !selectedLabel && 'text-muted-foreground',
        )"
      >
        <span class="min-w-0 flex-1 truncate">{{ selectedLabel ?? placeholder }}</span>
        <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" class="w-[360px] max-w-[calc(100vw-2rem)] p-0">
      <div class="border-b p-3">
        <div class="flex items-center gap-2 rounded-md border bg-background px-2">
          <Search class="size-4 shrink-0 text-muted-foreground" />
          <input
            ref="searchInputRef"
            v-model="searchTerm"
            type="text"
            autocomplete="off"
            :placeholder="searchPlaceholder"
            class="h-8 min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
          >
        </div>
      </div>

      <div class="max-h-72 overflow-y-auto py-2">
        <button
          v-if="emptyValue !== undefined"
          type="button"
          :class="cn(
            'mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
            isEmptySelected && 'bg-muted',
          )"
          @click="selectValue(emptyValue)"
        >
          <span class="min-w-0 flex-1 truncate text-muted-foreground">{{ emptyLabel }}</span>
          <Check v-if="isEmptySelected" class="size-4 shrink-0 text-foreground" />
        </button>

        <DepartmentTreeSelectNode
          v-for="department in visibleDepartments"
          :key="department.id"
          :node="department"
          :depth="0"
          :selected-value="modelValue"
          :force-open="searchTerm.trim().length > 0"
          @select="selectValue"
        />

        <div
          v-if="visibleDepartments.length === 0"
          class="px-4 py-8 text-center text-sm text-muted-foreground"
        >
          No departments found.
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
