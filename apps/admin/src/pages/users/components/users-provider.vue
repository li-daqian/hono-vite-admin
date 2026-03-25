<script lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { InjectionKey, Ref } from 'vue'
import { getRole } from '@admin/client'
import { defineComponent, inject, onMounted, provide, ref } from 'vue'

type User = UserProfileResponseSchema

export type UsersDialogType = 'add' | 'edit' | 'delete'

export interface UsersContextType {
  open: Ref<UsersDialogType | null>
  setOpen: (value: UsersDialogType | null) => void
  currentRow: Ref<User | null>
  setCurrentRow: (value: User | null) => void
  roleOptions: Ref<string[]>
  getUserRoles: (user: User) => string[]
  setUserRoles: (userId: string, roles: string[]) => void
  ensureRoleOption: (roleName: string) => void
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
    const roleOptions = ref<string[]>([])
    const userRoleOverrides = ref<Record<string, string[]>>({})

    function hasRoleName(source: string[], target: string) {
      const normalizedTarget = target.trim().toLowerCase()
      return source.some(roleName => roleName.trim().toLowerCase() === normalizedTarget)
    }

    const setOpen = (value: UsersDialogType | null) => {
      open.value = value
    }

    const setCurrentRow = (value: User | null) => {
      currentRow.value = value
    }

    const ensureRoleOption = (roleName: string) => {
      const normalizedRoleName = roleName.trim()
      if (!normalizedRoleName || hasRoleName(roleOptions.value, normalizedRoleName)) {
        return
      }

      roleOptions.value = [...roleOptions.value, normalizedRoleName].sort((left, right) => left.localeCompare(right))
    }

    const getUserRoles = (user: User) => {
      return userRoleOverrides.value[user.id] ?? user.roles ?? []
    }

    const setUserRoles = (userId: string, roles: string[]) => {
      userRoleOverrides.value = {
        ...userRoleOverrides.value,
        [userId]: [...roles],
      }
    }

    onMounted(async () => {
      try {
        const response = await getRole<true>()
        roleOptions.value = response.data
          .map(role => role.name.trim())
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right))
      }
      catch {
        roleOptions.value = []
      }
    })

    provide(USERS_CONTEXT_KEY, {
      open,
      setOpen,
      currentRow,
      setCurrentRow,
      roleOptions,
      getUserRoles,
      setUserRoles,
      ensureRoleOption,
    })

    return () => slots.default?.({
      open,
      setOpen,
      currentRow,
      setCurrentRow,
      roleOptions,
      getUserRoles,
      setUserRoles,
      ensureRoleOption,
    })
  },
})
</script>
