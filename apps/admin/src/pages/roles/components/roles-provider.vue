<script lang="ts">
import type { RoleProfileResponseSchema } from '@admin/client'
import type { InjectionKey, Ref } from 'vue'
import { defineComponent, inject, provide, ref } from 'vue'

export type RoleItem = RoleProfileResponseSchema
export type RolesDialogType = 'add' | 'edit' | 'delete'

export interface RolesContextType {
  open: Ref<RolesDialogType | null>
  setOpen: (value: RolesDialogType | null) => void
  currentRow: Ref<RoleItem | null>
  setCurrentRow: (value: RoleItem | null) => void
}

export const ROLES_CONTEXT_KEY: InjectionKey<RolesContextType> = Symbol('ROLES_CONTEXT_KEY')

export function useRoles() {
  const context = inject(ROLES_CONTEXT_KEY)
  if (!context) {
    throw new Error('useRoles has to be used within <RolesProvider>')
  }
  return context
}

export default defineComponent({
  name: 'RolesProvider',
  setup(_, { slots }) {
    const open = ref<RolesDialogType | null>(null)
    const currentRow = ref<RoleItem | null>(null)

    const setOpen = (value: RolesDialogType | null) => {
      open.value = value
    }

    const setCurrentRow = (value: RoleItem | null) => {
      currentRow.value = value
    }

    provide(ROLES_CONTEXT_KEY, { open, setOpen, currentRow, setCurrentRow })

    return () => slots.default?.({ open, setOpen, currentRow, setCurrentRow })
  },
})
</script>
