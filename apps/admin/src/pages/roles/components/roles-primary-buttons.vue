<script setup lang="ts">
import { Button } from '@admin/components/ui/button'
import { ShieldPlus } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'add'): void
}>()
</script>

<template>
  <div class="flex gap-2">
    <Button class="space-x-1" @click="emit('add')">
      <span>Add Role</span>
      <ShieldPlus :size="18" />
    </Button>
  </div>
</template>
