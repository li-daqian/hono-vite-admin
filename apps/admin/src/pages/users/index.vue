<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { DataTableSearchField, FetchRequest } from '@admin/components/data-table'
import { getUserPage } from '@admin/client'
import { DataTable, SearchFieldType } from '@admin/components/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { ref } from 'vue'
import UsersDataTableBulkActions from './component/data-table-bulk-actions.vue'
import DataTableRowActions from './component/data-table-row-actions.vue'
import { usersColumns } from './component/users-columns'
import UsersDialogs from './component/users-dialogs.vue'
import UsersPrimaryButtons from './component/users-primary-buttons.vue'
import UsersProvider from './component/users-provider.vue'

type UserPageItem = UserProfileResponseSchema

const tableRenderKey = ref(0)

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

function handleActionSuccess() {
  tableRenderKey.value += 1
}
</script>

<template>
  <UsersProvider v-slot="{ setOpen, setCurrentRow }">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle>User List</CardTitle>
        <UsersPrimaryButtons @add="() => { setCurrentRow(null); setOpen('add') }" />
      </CardHeader>

      <CardContent>
        <DataTable
          :key="tableRenderKey"
          :request="fetchUsers"
          :columns="usersColumns"
          :search="searchConfig"
          :operations="{ header: 'Actions', pin: 'right' }"
        >
          <template #operations="{ row }">
            <div class="flex items-center justify-end">
              <DataTableRowActions :row="row" />
            </div>
          </template>

          <template #bulk-actions="{ table }">
            <UsersDataTableBulkActions :table="table" />
          </template>
        </DataTable>

        <UsersDialogs @success="handleActionSuccess" />
      </CardContent>
    </Card>
  </UsersProvider>
</template>
