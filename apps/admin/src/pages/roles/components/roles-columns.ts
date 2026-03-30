import type { RoleProfileResponseSchema } from '@admin/client'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { DataTableColumnHeader } from '@admin/components/data-table'
import { h } from 'vue'
import DataTableRowActions from './data-table-row-actions.vue'

export type RoleItem = RoleProfileResponseSchema

function renderColumnHeader(column: Column<RoleItem, unknown>, title: string) {
  return h(DataTableColumnHeader, {
    column: column as unknown as Column<unknown, unknown>,
    title,
  })
}

export const rolesColumns: ColumnDef<RoleItem>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => renderColumnHeader(column, 'Name'),
    enableSorting: true,
    enableHiding: false,
    meta: {
      tdClassName: 'font-medium',
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: ({ column }) => renderColumnHeader(column, 'Description'),
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'text-muted-foreground' }, row.original.description ?? '—'),
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
