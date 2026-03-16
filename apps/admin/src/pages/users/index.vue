<script setup lang="ts">
import type { GetUserPageResponse } from '@admin/client'
import type { DataTableColumn, DataTableSearchField, FetchRequest } from '@admin/components/data-table'
import { getUserPage } from '@admin/client'
import { DataTable, SearchFieldType } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { h, ref } from 'vue'
import UsersDataTableBulkActions from './component/data-table-bulk-actions.vue'
import UsersActionDialog from './component/users-action-dialog.vue'
import UsersDeleteDialog from './component/users-delete-dialog.vue'
import UsersPrimaryButtons from './component/users-primary-buttons.vue'

type UserPageItem = GetUserPageResponse['items'][number]

const showDeleteConfirm = ref(false)
const currentRow = ref<UserPageItem | null>(null)
const actionOpen = ref(false)
const actionMode = ref<'add' | 'edit'>('add')
const selectedUserId = ref<string>()
const tableRenderKey = ref(0)

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

function openAddDialog() {
  actionMode.value = 'add'
  selectedUserId.value = undefined
  actionOpen.value = true
}

function openEditDialog(row: UserPageItem) {
  actionMode.value = 'edit'
  selectedUserId.value = row.id
  actionOpen.value = true
}

function handleActionOpenChange(open: boolean) {
  actionOpen.value = open
  if (!open)
    selectedUserId.value = undefined
}

function handleActionSuccess() {
  tableRenderKey.value += 1
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>User List</CardTitle>
      <UsersPrimaryButtons @add="openAddDialog" />
    </CardHeader>

    <CardContent>
      <DataTable
        :key="tableRenderKey"
        :request="fetchUsers"
        :columns="columns"
        :search="searchConfig"
        :operations="{ header: 'Actions', pin: 'right' }"
      >
        <template #operations="{ row }">
          <div class="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" @click="openEditDialog(row)">
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit user"
              title="Edit user"
              @click="openEditDialog(row)"
            >
              <Pencil />
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

      <UsersActionDialog
        v-if="actionOpen"
        :id="selectedUserId"
        :open="actionOpen"
        :mode="actionMode"
        @success="handleActionSuccess"
        @update:open="handleActionOpenChange"
      />
    </CardContent>
  </Card>
</template>
