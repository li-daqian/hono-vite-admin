<script setup lang="ts">
import type { GetUserPageResponse } from '@admin/client'
import type { DataTableColumn, DataTableSearchField, FetchRequest } from '@admin/components/data-table'
import { getUserPage } from '@admin/client'
import { DataTable, SearchFieldType } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Trash2 } from 'lucide-vue-next'
import { h, ref } from 'vue'
import UsersDataTableBulkActions from './component/data-table-bulk-actions.vue'
import UsersDeleteDialog from './component/users-delete-dialog.vue'

type UserPageItem = GetUserPageResponse['items'][number]

const showDeleteConfirm = ref(false)
const currentRow = ref<UserPageItem | null>(null)

const columns: DataTableColumn<UserPageItem>[] = [
  {
    header: 'Username',
    key: 'username',
    pin: 'left',
    sortable: true,
  },
  {
    header: 'Display Name',
    key: 'displayName',
    sortable: true,
  },
  {
    header: 'Phone',
    key: 'phone',
  },
  {
    header: 'Email',
    key: 'email',
    sortable: true,
  },
  {
    header: 'Status',
    key: 'status',
    sortable: true,
    cell: (_row, value) => h('div', { class: 'text-center' }, (value as string) ?? ''),
  },
]

const searchConfig: DataTableSearchField[] = [
  {
    key: 'search',
    type: SearchFieldType.Input,
    label: 'Search',
    placeholder: 'Username, email, display name',
  },
  {
    key: 'status',
    type: SearchFieldType.Multi,
    label: 'Status',
    placeholder: 'All',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Disabled', value: 'DISABLED' },
    ],
  },
]

const fetchUsers: FetchRequest<UserPageItem> = async (params) => {
  const response = await getUserPage<true>({ query: params })
  return response.data
}

function openDeleteDialog(row: UserPageItem) {
  currentRow.value = row
  showDeleteConfirm.value = true
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>User List</CardTitle>
    </CardHeader>

    <CardContent>
      <DataTable
        :request="fetchUsers"
        :columns="columns"
        :search="searchConfig"
        :operations="{ header: 'Actions', pin: 'right' }"
      >
        <template #operations="{ row }">
          <div class="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm">
              View
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete user"
              title="Delete user"
              @click="openDeleteDialog(row)"
            >
              <Trash2 />
            </Button>
          </div>
        </template>

        <template #bulk-actions="{ table }">
          <UsersDataTableBulkActions :table="table" />
        </template>
      </DataTable>

      <UsersDeleteDialog
        v-if="currentRow"
        :open="showDeleteConfirm"
        :current-row="currentRow"
        @update:open="showDeleteConfirm = $event"
      />
    </CardContent>
  </Card>
</template>
