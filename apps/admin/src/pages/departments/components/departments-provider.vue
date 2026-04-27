<script lang="ts">
import type { DepartmentProfileResponseSchema, DepartmentTreeItemSchema } from '@admin/client'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { DepartmentOption } from './department-utils'
import { getDepartment } from '@admin/client'
import { computed, defineComponent, inject, onMounted, provide, ref } from 'vue'
import {
  collectDepartmentAndDescendantIds,
  flattenDepartmentOptions,
} from './department-utils'

export type DepartmentItem = DepartmentProfileResponseSchema
export type DepartmentsDialogType = 'add' | 'edit' | 'delete'

export interface DepartmentsContextType {
  open: Ref<DepartmentsDialogType | null>
  setOpen: (value: DepartmentsDialogType | null) => void
  currentRow: Ref<DepartmentItem | null>
  setCurrentRow: (value: DepartmentItem | null) => void
  departmentTree: Ref<DepartmentTreeItemSchema[]>
  departmentOptions: ComputedRef<DepartmentOption[]>
  getDepartmentOptions: (excludeDepartmentId?: string) => DepartmentOption[]
  refreshDepartments: () => Promise<void>
  isLoadingDepartments: Ref<boolean>
}

export const DEPARTMENTS_CONTEXT_KEY: InjectionKey<DepartmentsContextType> = Symbol('DEPARTMENTS_CONTEXT_KEY')

export function useDepartments() {
  const context = inject(DEPARTMENTS_CONTEXT_KEY)
  if (!context) {
    throw new Error('useDepartments has to be used within <DepartmentsProvider>')
  }
  return context
}

export default defineComponent({
  name: 'DepartmentsProvider',
  setup(_, { slots }) {
    const open = ref<DepartmentsDialogType | null>(null)
    const currentRow = ref<DepartmentItem | null>(null)
    const departmentTree = ref<DepartmentTreeItemSchema[]>([])
    const isLoadingDepartments = ref(true)
    const departmentOptions = computed(() => flattenDepartmentOptions(departmentTree.value))

    const setOpen = (value: DepartmentsDialogType | null) => {
      open.value = value
    }

    const setCurrentRow = (value: DepartmentItem | null) => {
      currentRow.value = value
    }

    async function refreshDepartments() {
      isLoadingDepartments.value = true
      try {
        const response = await getDepartment<true>()
        departmentTree.value = response.data
      }
      catch {
        departmentTree.value = []
      }
      finally {
        isLoadingDepartments.value = false
      }
    }

    function getDepartmentOptions(excludeDepartmentId?: string) {
      const excludeIds = excludeDepartmentId
        ? collectDepartmentAndDescendantIds(departmentTree.value, excludeDepartmentId)
        : new Set<string>()
      return flattenDepartmentOptions(departmentTree.value, excludeIds)
    }

    onMounted(() => {
      void refreshDepartments()
    })

    provide(DEPARTMENTS_CONTEXT_KEY, {
      open,
      setOpen,
      currentRow,
      setCurrentRow,
      departmentTree,
      departmentOptions,
      getDepartmentOptions,
      refreshDepartments,
      isLoadingDepartments,
    })

    return () => slots.default?.({
      open,
      setOpen,
      currentRow,
      setCurrentRow,
      departmentTree,
      departmentOptions,
      getDepartmentOptions,
      refreshDepartments,
      isLoadingDepartments,
    })
  },
})
</script>
