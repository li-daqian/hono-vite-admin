import type { UserProfileResponseSchema } from '@admin/client'
import type { CellContext, ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@admin/components/ui/badge'
import { cn } from '@admin/lib/utils'
import { h } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'

export type UserPageItem = UserProfileResponseSchema

export const statusClassMap: Record<UserPageItem['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

export const usersColumns: ColumnDef<UserPageItem>[] = [
  {
    id: 'select',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => h('input', {
      'type': 'checkbox',
      'checked': table.getIsAllPageRowsSelected(),
      'indeterminate': table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
      'aria-label': 'Select all rows on current page',
      'class': 'size-4 cursor-pointer accent-primary',
      'onChange': (event: Event) => {
        table.toggleAllPageRowsSelected((event.target as HTMLInputElement).checked)
      },
    }),
    cell: ({ row }: CellContext<UserPageItem, unknown>) => h('input', {
      'type': 'checkbox',
      'checked': row.getIsSelected(),
      'indeterminate': row.getIsSomeSelected() && !row.getIsSelected(),
      'disabled': !row.getCanSelect(),
      'aria-label': `Select user ${row.original.username}`,
      'class': 'size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50',
      'onChange': (event: Event) => {
        row.toggleSelected((event.target as HTMLInputElement).checked)
      },
    }),
  },
  {
    id: 'username',
    accessorKey: 'username',
    header: 'Username',
    enableSorting: true,
    enableHiding: false,
    meta: {
      tdClassName: 'font-medium',
    },
  },
  {
    id: 'displayName',
    accessorKey: 'displayName',
    header: 'Display Name',
    enableSorting: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
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
