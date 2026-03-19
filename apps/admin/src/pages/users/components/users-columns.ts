import type { UserProfileResponseSchema } from '@admin/client'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import type { CheckboxCheckedState } from 'reka-ui'
import { DataTableColumnHeader } from '@admin/components/data-table'
import { Badge } from '@admin/components/ui/badge'
import { Checkbox } from '@admin/components/ui/checkbox'
import { cn } from '@admin/lib/utils'
import { h } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'

export type UserPageItem = UserProfileResponseSchema

export const statusClassMap: Record<UserPageItem['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

function renderColumnHeader(column: Column<UserPageItem, unknown>, title: string) {
  return h(DataTableColumnHeader, {
    column: column as unknown as Column<unknown, unknown>,
    title,
  })
}

export const usersColumns: ColumnDef<UserPageItem>[] = [
  {
    id: 'select',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => h(Checkbox, {
      'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:modelValue': (value: CheckboxCheckedState) => {
        table.toggleAllPageRowsSelected(!!value)
      },
      'aria-label': 'Select all',
      'class': 'translate-y-[2px]',
    }),
    cell: ({ row }) => h(Checkbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: CheckboxCheckedState) => {
        row.toggleSelected(!!value)
      },
      'disabled': !row.getCanSelect(),
      'aria-label': `Select user ${row.original.username}`,
      'class': 'translate-y-[2px]',
    }),
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: ({ column }) => renderColumnHeader(column, 'Username'),
    enableSorting: true,
    enableHiding: false,
    meta: {
      tdClassName: 'font-medium',
    },
  },
  {
    id: 'displayName',
    accessorKey: 'displayName',
    header: ({ column }) => renderColumnHeader(column, 'Display Name'),
    enableSorting: true,
    meta: {
      label: 'Display Name',
    },
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }) => renderColumnHeader(column, 'Email'),
    enableSorting: true,
    meta: {
      label: 'Email',
    },
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }) => renderColumnHeader(column, 'Phone'),
    enableSorting: false,
    meta: {
      label: 'Phone',
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => renderColumnHeader(column, 'Status'),
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => h(Badge, {
      variant: 'outline',
      class: cn('capitalize', statusClassMap[row.original.status]),
    }, () => row.original.status.toLowerCase()),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableHiding: false,
    meta: {
      thClassName: 'text-right',
    },
    cell: ({ row }) => h('div', { class: 'flex items-center justify-end' }, [
      h(DataTableRowActions, { row: row.original }),
    ]),
  },
]
