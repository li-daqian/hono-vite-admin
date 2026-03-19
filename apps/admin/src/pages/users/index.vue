<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { ref } from 'vue'
import UsersDialogs from './component/users-dialogs.vue'
import UsersPrimaryButtons from './component/users-primary-buttons.vue'
import UsersProvider from './component/users-provider.vue'
import UsersTable from './component/users-table.vue'

const tableRenderKey = ref(0)

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
        <UsersTable :refresh-key="tableRenderKey" />

        <UsersDialogs @success="handleActionSuccess" />
      </CardContent>
    </Card>
  </UsersProvider>
</template>
