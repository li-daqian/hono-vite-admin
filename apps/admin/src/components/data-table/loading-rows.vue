<script setup lang="ts">
import { Skeleton } from '@admin/components/ui/skeleton'
import { TableCell, TableRow } from '@admin/components/ui/table'
import { cn } from '@admin/lib/utils'

const props = withDefaults(defineProps<{
  columnCount: number
  rowCount?: number
}>(), {
  rowCount: 5,
})

const textWidths = ['w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56']

function getSkeletonClass(columnIndex: number, rowIndex: number) {
  if (columnIndex === 0 && props.columnCount > 3) {
    return 'h-4 w-4 rounded-sm'
  }

  if (columnIndex === props.columnCount - 1) {
    return 'ml-auto h-8 w-16'
  }

  return cn('h-4', textWidths[(columnIndex + rowIndex) % textWidths.length])
}
</script>

<template>
  <TableRow v-for="rowIndex in props.rowCount" :key="rowIndex">
    <TableCell
      v-for="columnIndex in props.columnCount"
      :key="`${rowIndex}-${columnIndex}`"
    >
      <Skeleton :class="getSkeletonClass(columnIndex - 1, rowIndex - 1)" />
    </TableCell>
  </TableRow>
</template>
