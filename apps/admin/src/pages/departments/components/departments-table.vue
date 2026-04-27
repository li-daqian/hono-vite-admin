<script setup lang="ts">
import type { DepartmentTableRow } from './department-utils'
import { DataTableLoadingRows } from '@admin/components/data-table'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table'
import { cn } from '@admin/lib/utils'
import { RotateCw, Search, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'
import { flattenDepartmentTree } from './department-utils'
import { useDepartments } from './departments-provider.vue'

const props = withDefaults(defineProps<{
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const { departmentTree, refreshDepartments, isLoadingDepartments } = useDepartments()
const search = ref('')
const status = ref<'ALL' | DepartmentTableRow['status']>('ALL')

const statusClassMap: Record<DepartmentTableRow['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

const rows = computed(() => flattenDepartmentTree(departmentTree.value))
const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return rows.value.filter((row) => {
    const matchesSearch = !keyword
      || row.name.toLowerCase().includes(keyword)
      || row.code.toLowerCase().includes(keyword)
      || (row.leader?.toLowerCase().includes(keyword) ?? false)
      || (row.email?.toLowerCase().includes(keyword) ?? false)

    const matchesStatus = status.value === 'ALL' || row.status === status.value
    return matchesSearch && matchesStatus
  })
})

function clearFilters() {
  search.value = ''
  status.value = 'ALL'
}

watch(() => props.refreshKey, () => {
  void refreshDepartments()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div class="relative w-full sm:max-w-xs">
          <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input v-model="search" class="h-9 pl-8" placeholder="Filter departments..." />
        </div>

        <Select v-model="status">
          <SelectTrigger class="h-9 w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              All status
            </SelectItem>
            <SelectItem value="ACTIVE">
              Active
            </SelectItem>
            <SelectItem value="DISABLED">
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>

        <Button v-if="search || status !== 'ALL'" variant="ghost" size="sm" class="h-9 px-2" @click="clearFilters">
          Reset
          <X class="ms-1 size-4" />
        </Button>
      </div>

      <Button variant="outline" size="sm" class="h-9" :disabled="isLoadingDepartments" @click="refreshDepartments">
        <RotateCw :class="cn('me-1 size-4', isLoadingDepartments ? 'animate-spin' : undefined)" />
        Refresh
      </Button>
    </div>

    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow class="group/row">
            <TableHead class="bg-background group-hover/row:bg-muted">
              Name
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Code
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Leader
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Contact
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted">
              Status
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted text-right">
              Users
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted text-right">
              Order
            </TableHead>
            <TableHead class="bg-background group-hover/row:bg-muted text-right" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <DataTableLoadingRows v-if="isLoadingDepartments" :column-count="8" />

          <template v-else-if="filteredRows.length">
            <TableRow v-for="row in filteredRows" :key="row.id" class="group/row">
              <TableCell class="bg-background group-hover/row:bg-muted">
                <div class="flex min-w-[220px] items-center gap-2" :style="{ paddingLeft: `${row.depth * 1.25}rem` }">
                  <span class="text-muted-foreground w-4 shrink-0 text-center">
                    {{ row.hasChildren ? '>' : '' }}
                  </span>
                  <span class="font-medium">{{ row.name }}</span>
                </div>
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted">
                <code class="text-muted-foreground text-xs">{{ row.code }}</code>
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted">
                {{ row.leader ?? '-' }}
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted">
                <div class="max-w-[240px] space-y-1 text-sm">
                  <div>{{ row.phone ?? '-' }}</div>
                  <div class="text-muted-foreground truncate">
                    {{ row.email ?? '-' }}
                  </div>
                </div>
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted">
                <Badge variant="outline" :class="cn('capitalize', statusClassMap[row.status])">
                  {{ row.status.toLowerCase() }}
                </Badge>
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted text-right">
                {{ row.userCount }}
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted text-right">
                {{ row.order }}
              </TableCell>
              <TableCell class="bg-background group-hover/row:bg-muted">
                <div class="flex items-center justify-end">
                  <DataTableRowActions :row="row" />
                </div>
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="8" class="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
