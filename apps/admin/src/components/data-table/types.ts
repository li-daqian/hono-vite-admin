import type { PaginationMetaSchema } from '@admin/client'
import type { Component } from 'vue'

export interface DataTableSearchOption {
  label: string
  value: string
  icon?: Component
}

export interface DataTableFilterField {
  columnId: string
  title: string
  options: DataTableSearchOption[]
}

export interface PaginatedResponse<TItem> {
  items: TItem[]
  meta: PaginationMetaSchema
}

export type FetchRequestParams = Record<string, unknown> & {
  page: number
  pageSize: number
  sort?: string | null
}

export type FetchRequest<TItem> = (
  params: FetchRequestParams,
) => Promise<PaginatedResponse<TItem>>
