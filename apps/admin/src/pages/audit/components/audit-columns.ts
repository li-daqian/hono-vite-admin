import type { AuditLogListItemSchema } from '@admin/client'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { DataTableColumnHeader } from '@admin/components/data-table'
import { Badge } from '@admin/components/ui/badge'
import { Button } from '@admin/components/ui/button'
import { getDictionaryColorClass } from '@admin/lib/dictionary'
import { useDictionaryStore } from '@admin/stores/dictionaries'
import { h } from 'vue'
import { formatAuditDateTime, formatAuditLabel, formatAuditOperator } from './audit-utils'

export type AuditLogItem = AuditLogListItemSchema

function renderColumnHeader(column: Column<AuditLogItem, unknown>, title: string) {
  return h(DataTableColumnHeader, {
    column: column as unknown as Column<unknown, unknown>,
    title,
  })
}

export function getAuditColumns(onView: (row: AuditLogItem) => void): ColumnDef<AuditLogItem>[] {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column }) => renderColumnHeader(column, 'Time'),
      enableSorting: true,
      enableHiding: false,
      meta: {
        label: 'Time',
        tdClassName: 'whitespace-nowrap font-medium',
      },
      cell: ({ row }) => formatAuditDateTime(row.original.createdAt),
    },
    {
      id: 'module',
      accessorKey: 'module',
      header: ({ column }) => renderColumnHeader(column, 'Module'),
      enableSorting: true,
      meta: {
        label: 'Module',
      },
      cell: ({ row }) => {
        const dictionaryStore = useDictionaryStore()
        const moduleOption = dictionaryStore.getOption('audit_module', row.original.module)

        return h(Badge, {
          variant: 'outline',
          class: getDictionaryColorClass(moduleOption.color),
        }, () => moduleOption.label || formatAuditLabel(row.original.module))
      },
    },
    {
      id: 'action',
      accessorKey: 'action',
      header: ({ column }) => renderColumnHeader(column, 'Action'),
      enableSorting: true,
      meta: {
        label: 'Action',
      },
      cell: ({ row }) => h('span', { class: 'font-medium' }, formatAuditLabel(row.original.action)),
    },
    {
      id: 'operatorUsername',
      accessorKey: 'operatorUsername',
      header: ({ column }) => renderColumnHeader(column, 'Operator'),
      enableSorting: true,
      meta: {
        label: 'Operator',
        tdClassName: 'min-w-[220px]',
      },
      cell: ({ row }) => h('span', formatAuditOperator(row.original)),
    },
    {
      id: 'method',
      accessorKey: 'method',
      header: ({ column }) => renderColumnHeader(column, 'Method'),
      enableSorting: false,
      meta: {
        label: 'Method',
      },
      cell: ({ row }) => h('span', { class: 'font-mono text-xs uppercase text-muted-foreground' }, row.original.method),
    },
    {
      id: 'path',
      accessorKey: 'path',
      header: ({ column }) => renderColumnHeader(column, 'Path'),
      enableSorting: false,
      meta: {
        label: 'Path',
        tdClassName: 'min-w-[260px] max-w-[360px] font-mono text-xs',
      },
      cell: ({ row }) => h('span', { class: 'truncate block' }, row.original.path),
    },
    {
      id: 'ip',
      accessorKey: 'ip',
      header: ({ column }) => renderColumnHeader(column, 'IP'),
      enableSorting: false,
      meta: {
        label: 'IP',
        tdClassName: 'font-mono text-xs',
      },
      cell: ({ row }) => row.original.ip ?? '—',
    },
    {
      id: 'requestId',
      accessorKey: 'requestId',
      header: ({ column }) => renderColumnHeader(column, 'Request ID'),
      enableSorting: false,
      meta: {
        label: 'Request ID',
        tdClassName: 'font-mono text-xs min-w-[180px]',
      },
      cell: ({ row }) => row.original.requestId,
    },
    {
      id: 'userAgent',
      accessorKey: 'userAgent',
      header: ({ column }) => renderColumnHeader(column, 'User Agent'),
      enableSorting: false,
      meta: {
        label: 'User Agent',
        tdClassName: 'min-w-[280px] max-w-[360px] text-xs text-muted-foreground',
      },
      cell: ({ row }) => h('span', { class: 'truncate block' }, row.original.userAgent ?? '—'),
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
        h(Button, {
          variant: 'outline',
          size: 'sm',
          onClick: () => onView(row.original),
        }, () => 'View'),
      ]),
    },
  ]
}
