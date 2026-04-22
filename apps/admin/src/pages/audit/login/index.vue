<script setup lang="ts">
import AuditTable from '../components/audit-table.vue'
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 sm:gap-6">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">
        Login Logs
      </h2>
      <p class="text-muted-foreground">
        Review successful and failed sign-ins and sign-outs recorded by the admin system.
      </p>
    </div>

    <AuditTable mode="login" />
  </div>
</template>
