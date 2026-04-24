<script lang="ts">
import type { UserProfileResponseSchema } from '@admin/client'
import type { InjectionKey, Ref } from 'vue'
import { getRole } from '@admin/client'
import { defineComponent, inject, onMounted, provide, ref } from 'vue'

type User = UserProfileResponseSchema
type UserRole = User['roles'][number]

export type UsersDialogType = 'add' | 'edit' | 'password' | 'delete'

export interface UsersContextType {
  open: Ref<UsersDialogType | null>
  setOpen: (value: UsersDialogType | null) => void
  currentRow: Ref<User | null>
  setCurrentRow: (value: User | null) => void
  roleOptions: Ref<{ value: string, label: string }[]>
  getUserRoles: (user: User) => UserRole[]
  setUserRoles: (userId: string, roles: UserRole[]) => void
  ensureRoleOption: (roleId: string, roleName: string) => void
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
    const roleOptions = ref<{ value: string, label: string }[]>([])
    const userRoleOverrides = ref<Record<string, UserRole[]>>({})

    function hasRoleId(source: { value: string }[], id: string) {
      return source.some(o => o.value === id)
    }

    const setOpen = (value: UsersDialogType | null) => {
      open.value = value
    }

    const setCurrentRow = (value: User | null) => {
      currentRow.value = value
    }

    const ensureRoleOption = (roleId: string, roleName: string) => {
      if (!roleId || hasRoleId(roleOptions.value, roleId)) {
        return
      }

      roleOptions.value = [...roleOptions.value, { value: roleId, label: roleName.trim() }]
        .sort((a, b) => a.label.localeCompare(b.label))
    }

    const getUserRoles = (user: User) => {
      return userRoleOverrides.value[user.id] ?? user.roles ?? []
    }

    const setUserRoles = (userId: string, roles: UserRole[]) => {
      userRoleOverrides.value = {
        ...userRoleOverrides.value,
        [userId]: roles.map(role => ({ ...role })),
      }
    }

    onMounted(async () => {
      try {
        const response = await getRole<true>()
        roleOptions.value = response.data
          .filter(role => role.id && role.name)
          .map(role => ({ value: role.id, label: role.name.trim() }))
          .sort((a, b) => a.label.localeCompare(b.label))
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
