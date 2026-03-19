<script lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { InjectionKey, Ref } from 'vue'
import { defineComponent, inject, provide, ref } from 'vue'

type User = UserProfileResponseSchema

export type UsersDialogType = 'add' | 'edit' | 'delete'

export interface UsersContextType {
  open: Ref<UsersDialogType | null>
  setOpen: (value: UsersDialogType | null) => void
  currentRow: Ref<User | null>
  setCurrentRow: (value: User | null) => void
}

export const USERS_CONTEXT_KEY: InjectionKey<UsersContextType> = Symbol('USERS_CONTEXT_KEY')

export function useUsers() {
  const usersContext = inject(USERS_CONTEXT_KEY)

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersProvider>')
  }

  return usersContext
}

export default defineComponent({
  name: 'UsersProvider',
  setup(_, { slots }) {
    const open = ref<UsersDialogType | null>(null)
    const currentRow = ref<User | null>(null)

    const setOpen = (value: UsersDialogType | null) => {
      open.value = value
    }

    const setCurrentRow = (value: User | null) => {
      currentRow.value = value
    }

    provide(USERS_CONTEXT_KEY, {
      open,
      setOpen,
      currentRow,
      setCurrentRow,
    })

    return () => slots.default?.({
      open,
      setOpen,
      currentRow,
      setCurrentRow,
    })
  },
})
</script>
