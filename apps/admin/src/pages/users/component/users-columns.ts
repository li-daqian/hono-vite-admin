import type { UserProfileResponseSchema } from '@admin/client'
import type { DataTableColumn } from '@admin/components/data-table'
import { Badge } from '@admin/components/ui/badge'
import { cn } from '@admin/lib/utils'
import { h } from 'vue'

type UserPageItem = UserProfileResponseSchema

const statusClassMap: Record<UserPageItem['status'], string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISABLED: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

export const usersColumns: DataTableColumn<UserPageItem>[] = [
  {
    header: 'Username',
    key: 'username',
    pin: 'left',
    sortable: true,
  },
  {
    header: 'Display Name',
    key: 'displayName',
    sortable: true,
  },
  {
    header: 'Phone',
    key: 'phone',
  },
  {
    header: 'Email',
    key: 'email',
    sortable: true,
  },
  {
    header: 'Status',
    key: 'status',
    sortable: true,
    cell: (row) => {
      const status = row.status
      return h('div', { class: 'flex justify-center' }, [
        h(Badge, {
          variant: 'outline',
          class: cn('capitalize', statusClassMap[status]),
        }, () => status.toLowerCase()),
      ])
    },
  },
]
