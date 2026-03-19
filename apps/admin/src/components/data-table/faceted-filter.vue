<script setup lang="ts" generic="TData, TValue">
import type { Column } from '@tanstack/vue-table'
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

const props = defineProps<{
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    icon?: any
  }[]
}>()

const facets = computed(() => props.column?.getFacetedUniqueValues())
const selectedValues = computed(() => new Set((props.column?.getFilterValue() as string[]) ?? []))

function toggleOption(optionValue: string) {
  const next = new Set(selectedValues.value)

  if (next.has(optionValue)) {
    next.delete(optionValue)
  }
  else {
    next.add(optionValue)
  }

  const values = Array.from(next)
  props.column?.setFilterValue(values.length > 0 ? values : undefined)
}

function clearFilters() {
  props.column?.setFilterValue(undefined)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <CirclePlus class="size-4" />
        {{ props.title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
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
                v-for="option in props.options.filter(option => selectedValues.has(option.value))"
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
                <Check class="h-4 w-4" />
              </div>

              <component
                :is="option.icon"
                v-if="option.icon"
                class="size-4 text-muted-foreground"
              />

              <span>{{ option.label }}</span>

              <span v-if="facets?.get(option.value)" class="ms-auto flex h-4 w-4 items-center justify-center text-xs font-mono">
                {{ facets.get(option.value) }}
              </span>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem :value="`clear-${props.title ?? 'filters'}`" class="justify-center text-center" @select="clearFilters">
                Clear filters
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
