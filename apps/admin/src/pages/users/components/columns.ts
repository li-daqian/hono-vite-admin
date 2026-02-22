import type { GetUserPageResponse } from '@admin/client'
import type { ColumnDef } from '@tanstack/vue-table'

type UserPageItem = GetUserPageResponse['items'][number]

export const columns: ColumnDef<UserPageItem>[] = [
  {
    header: 'Username',
    accessorKey: 'username',
  },
  {
    header: 'Display Name',
    accessorKey: 'displayName',
  },
  {
    header: 'Phone',
    accessorKey: 'phone',
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Status',
    accessorKey: 'status',
  },
]
