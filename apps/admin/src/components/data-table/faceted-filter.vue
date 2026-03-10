<script setup lang="ts">
import type { Component } from 'vue'
import type { DataTableSearchOption } from './types'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@admin/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@admin/components/ui/popover'
import { Separator } from '@admin/components/ui/separator'
import { cn } from '@admin/lib/utils'
import { Check, CirclePlus } from 'lucide-vue-next'
import { computed } from 'vue'

export interface DataTableFacetedFilterProps {
  title?: string
  options: DataTableSearchOption[]
  modelValue?: string | string[]
  mode?: 'single' | 'multi'
  icon?: Component
  class?: string
}

const props = withDefaults(defineProps<DataTableFacetedFilterProps>(), {
  mode: 'multi',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[] | undefined): void
}>()

// Compute selected values as a Set for easy lookup
const selectedValues = computed(() => {
  if (props.mode === 'multi') {
    return new Set(Array.isArray(props.modelValue) ? props.modelValue : [])
  }
  else {
    return new Set(props.modelValue ? [props.modelValue] : [])
  }
})

// Toggle selection for an option
function toggleOption(optionValue: string) {
  if (props.mode === 'multi') {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    if (currentValues.includes(optionValue)) {
      const filtered = currentValues.filter(v => v !== optionValue)
      emit('update:modelValue', filtered.length ? filtered : undefined)
    }
    else {
      emit('update:modelValue', [...currentValues, optionValue])
    }
  }
  else {
    // Single mode: if already selected, clear; otherwise set
    if (props.modelValue === optionValue) {
      emit('update:modelValue', undefined)
    }
    else {
      emit('update:modelValue', optionValue)
    }
  }
}

// Clear all selections
function clearFilters() {
  emit('update:modelValue', undefined)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" :class="cn('border-dashed', props.class)">
        <CirclePlus class="size-4" />
        {{ props.title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            <Badge
              v-if="selectedValues.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.size }} selected
            </Badge>
            <template v-else>
              <Badge
                v-for="option in props.options.filter(opt => selectedValues.has(opt.value))"
                :key="option.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ option.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-50 p-0" align="start">
      <Command>
        <CommandInput :placeholder="props.title" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in props.options"
              :key="option.value"
              :value="option.value"
              @select="() => toggleOption(option.value)"
            >
              <div
                :class="cn(
                  'flex size-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Check :class="cn('h-4 w-4 text-background')" />
              </div>
              <component
                :is="props.icon"
                v-if="props.icon"
                class="size-4 text-muted-foreground"
              />
              <span>{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>
          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="`clear-${props.title}`"
                class="justify-center text-center"
                @select="clearFilters"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
