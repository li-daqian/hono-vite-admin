<script setup lang="ts">
import type { GetUserPageResponse } from '@admin/client'
import type { DataTableColumn, DataTableSearchField } from '@admin/components/data-table'
import { DataTable, SearchFieldType } from '@admin/components/data-table'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { h } from 'vue'

type UserPageItem = GetUserPageResponse['items'][number]

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
    cell: (_row, value) => h('div', { class: 'text-center' }, value ?? ''),
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
    type: SearchFieldType.Single,
    label: 'Status',
    placeholder: 'All',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Disabled', value: 'DISABLED' },
    ],
  },
]
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Users</CardTitle>
    </CardHeader>

    <CardContent>
      <DataTable
        request-url="/user/page"
        :columns="columns"
        :search="searchConfig"
        :operations="{ header: 'Actions', pin: 'right' }"
      >
        <template #operations>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </template>
      </DataTable>
    </CardContent>
  </Card>
</template>
