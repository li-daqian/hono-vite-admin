<script setup lang="ts">
import { ref } from 'vue'
import DepartmentsDialogs from './components/departments-dialogs.vue'
import DepartmentsPrimaryButtons from './components/departments-primary-buttons.vue'
import DepartmentsProvider from './components/departments-provider.vue'
import DepartmentsTable from './components/departments-table.vue'

const tableRenderKey = ref(0)

function handleActionSuccess() {
  tableRenderKey.value += 1
}
</script>

<template>
  <DepartmentsProvider v-slot="{ setOpen, setCurrentRow }">
    <div class="flex flex-1 flex-col gap-4 sm:gap-6">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">
            Department Tree
          </h2>
          <p class="text-muted-foreground">
            Manage organization departments and user assignments here.
          </p>
        </div>
        <DepartmentsPrimaryButtons @add="() => { setCurrentRow(null); setOpen('add') }" />
      </div>

      <DepartmentsTable :refresh-key="tableRenderKey" />

      <DepartmentsDialogs @success="handleActionSuccess" />
    </div>
  </DepartmentsProvider>
</template>
