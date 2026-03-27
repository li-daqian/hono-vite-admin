<script setup lang="ts">
import { DataTableRefreshButton } from '@admin/components/data-table'
import { ref } from 'vue'
import UsersDialogs from './components/users-dialogs.vue'
import UsersPrimaryButtons from './components/users-primary-buttons.vue'
import UsersProvider from './components/users-provider.vue'
import UsersTable from './components/users-table.vue'

const tableRenderKey = ref(0)
const usersTableRef = ref<InstanceType<typeof UsersTable> | null>(null)
const isRefreshing = ref(false)

function handleActionSuccess() {
  tableRenderKey.value += 1
}

async function handleRefreshTable() {
  if (!usersTableRef.value || isRefreshing.value) {
    return
  }

  isRefreshing.value = true

  try {
    await usersTableRef.value.refreshTable()
  }
  finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <UsersProvider v-slot="{ setOpen, setCurrentRow }">
    <div class="flex flex-1 flex-col gap-4 sm:gap-6">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">
            User List
          </h2>
          <p class="text-muted-foreground">
            Manage your users and their roles here.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <DataTableRefreshButton :loading="isRefreshing" @refresh="handleRefreshTable" />
          <UsersPrimaryButtons @add="() => { setCurrentRow(null); setOpen('add') }" />
        </div>
      </div>

      <UsersTable ref="usersTableRef" :refresh-key="tableRenderKey" />

      <UsersDialogs @success="handleActionSuccess" />
    </div>
  </UsersProvider>
</template>
