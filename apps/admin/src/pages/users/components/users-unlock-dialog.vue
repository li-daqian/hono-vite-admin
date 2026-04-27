<script setup lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import { postUserByIdUnlock } from '@admin/client'
import ConfirmDialog from '@admin/components/ConfirmDialog.vue'
import { LockOpen } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

type User = UserProfileResponseSchema

const props = defineProps<{
  open: boolean
  currentRow: User
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const isUnlocking = ref(false)
const lockedUntilText = computed(() => props.currentRow.lockedUntil?.toLocaleString() ?? 'the lock expires')

function handleOpenChange(open: boolean) {
  emit('update:open', open)
}

async function handleUnlock() {
  isUnlocking.value = true
  try {
    await postUserByIdUnlock<true>({
      path: {
        id: props.currentRow.id,
      },
    })

    handleOpenChange(false)
    toast.success(`User "${props.currentRow.username}" unlocked.`)
    emit('success')
  }
  finally {
    isUnlocking.value = false
  }
}
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :handle-confirm="handleUnlock"
    :is-loading="isUnlocking"
    confirm-text="Unlock"
    @update:open="handleOpenChange"
  >
    <template #title>
      <span>
        <LockOpen class="me-1 inline-block" :size="18" />
        Unlock User
      </span>
    </template>

    <template #desc>
      <p class="text-sm leading-6">
        Unlock
        <span class="font-bold">{{ props.currentRow.username }}</span>
        before {{ lockedUntilText }}?
      </p>
    </template>
  </ConfirmDialog>
</template>
