<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import type { HTMLAttributes } from 'vue'
import { Button } from '@admin/components/ui/button'
import { cn } from '@admin/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from '@radix-icons/vue'

const props = defineProps<{
  column: Column<unknown, unknown>
  title: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    v-if="!props.column.getCanSort()"
    :class="cn(props.class)"
  >
    {{ props.title }}
  </div>
  <div v-else :class="cn('flex items-center space-x-2', props.class)">
    <Button
      variant="ghost"
      size="sm"
      class="h-8 px-0 has-[>svg]:px-0"
      @click="props.column.toggleSorting()"
    >
      <span>{{ props.title }}</span>
      <ArrowDownIcon
        v-if="props.column.getIsSorted() === 'desc'"
        class="ms-2 h-4 w-4"
      />
      <ArrowUpIcon
        v-else-if="props.column.getIsSorted() === 'asc'"
        class="ms-2 h-4 w-4"
      />
      <CaretSortIcon
        v-else
        class="ms-2 h-4 w-4"
      />
    </Button>
  </div>
</template>
