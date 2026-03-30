<script setup lang="ts">
import { ref } from 'vue'
import RolesDialogs from './components/roles-dialogs.vue'
import RolesPrimaryButtons from './components/roles-primary-buttons.vue'
import RolesProvider from './components/roles-provider.vue'
import RolesTable from './components/roles-table.vue'

const tableRenderKey = ref(0)

function handleActionSuccess() {
  tableRenderKey.value += 1
}
</script>

<template>
  <RolesProvider v-slot="{ setOpen, setCurrentRow }">
    <div class="flex flex-1 flex-col gap-4 sm:gap-6">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">
            Role List
          </h2>
          <p class="text-muted-foreground">
            Manage roles and their permissions here.
          </p>
        </div>
        <RolesPrimaryButtons @add="() => { setCurrentRow(null); setOpen('add') }" />
      </div>

      <RolesTable :refresh-key="tableRenderKey" />

      <RolesDialogs @success="handleActionSuccess" />
    </div>
  </RolesProvider>
</template>
