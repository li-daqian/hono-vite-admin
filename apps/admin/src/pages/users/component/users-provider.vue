<script lang="ts">
import type { GetUserPageResponse } from '@admin/client'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type User = GetUserPageResponse['items'][number]

export type UsersDialogType = 'add' | 'edit' | 'delete'

export const useUsersStore = defineStore('users', () => {
  const open = ref<UsersDialogType | null>(null)
  const currentRow = ref<User | null>(null)

  function setOpen(value: UsersDialogType | null) {
    open.value = value
  }

  function setCurrentRow(value: User | null) {
    currentRow.value = value
  }

  return { open, setOpen, currentRow, setCurrentRow }
})
</script>
