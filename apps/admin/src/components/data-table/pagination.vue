<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import type { HTMLAttributes } from 'vue'
import { Button } from '@admin/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import { cn, getPageNumbers } from '@admin/lib/utils'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  table: Table<TData>
  class?: HTMLAttributes['class']
}>()

const currentPage = computed(() => props.table.getState().pagination.pageIndex + 1)
const totalPages = computed(() => props.table.getPageCount())
const pageNumbers = computed(() => getPageNumbers(currentPage.value, totalPages.value))

const pageSizeValue = computed(() => `${props.table.getState().pagination.pageSize}`)

function setPageSize(value: unknown) {
  const parsedValue = Number(value)
  if (!Number.isFinite(parsedValue)) {
    return
  }

  props.table.setPageSize(parsedValue)
}

function goToPage(pageNumber: number) {
  props.table.setPageIndex(pageNumber - 1)
}
</script>

<template>
  <div
    :class="cn(
      'flex items-center justify-between overflow-clip px-2',
      '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
      props.class)"
    style="overflow-clip-margin: 1"
  >
    <div class="flex w-full items-center justify-between">
      <div class="flex items-center gap-2 @max-2xl/content:flex-row-reverse">
        <Select :model-value="pageSizeValue" @update:model-value="setPageSize">
          <SelectTrigger class="h-8 w-17.5">
            <SelectValue :placeholder="`${props.table.getState().pagination.pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem v-for="pageSize in [10, 20, 30, 40, 50]" :key="pageSize" :value="`${pageSize}`">
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="hidden text-sm font-medium sm:block">
          Rows per page
        </p>
      </div>

      <div class="flex items-center sm:space-x-6 lg:space-x-8">
        <div class="flex w-25 items-center justify-center text-sm font-medium @max-3xl/content:hidden">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            class="size-8 p-0 @max-md/content:hidden"
            :disabled="!props.table.getCanPreviousPage()"
            @click="props.table.setPageIndex(0)"
          >
            <span class="sr-only">Go to first page</span>
            <ChevronsLeftIcon class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="size-8 p-0"
            :disabled="!props.table.getCanPreviousPage()"
            @click="props.table.previousPage()"
          >
            <span class="sr-only">Go to previous page</span>
            <ChevronLeftIcon class="h-4 w-4" />
          </Button>

          <div
            v-for="(pageNumber, index) in pageNumbers"
            :key="`${pageNumber}-${index}`"
            class="flex items-center"
          >
            <span v-if="pageNumber === '...'" class="px-1 text-sm text-muted-foreground">...</span>
            <Button
              v-else
              :variant="currentPage === pageNumber ? 'default' : 'outline'"
              class="h-8 min-w-8 px-2"
              @click="goToPage(pageNumber)"
            >
              <span class="sr-only">Go to page {{ pageNumber }}</span>
              {{ pageNumber }}
            </Button>
          </div>

          <Button
            variant="outline"
            class="size-8 p-0"
            :disabled="!props.table.getCanNextPage()"
            @click="props.table.nextPage()"
          >
            <span class="sr-only">Go to next page</span>
            <ChevronRightIcon class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="size-8 p-0 @max-md/content:hidden"
            :disabled="!props.table.getCanNextPage()"
            @click="props.table.setPageIndex(props.table.getPageCount() - 1)"
          >
            <span class="sr-only">Go to last page</span>
            <ChevronsRightIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
