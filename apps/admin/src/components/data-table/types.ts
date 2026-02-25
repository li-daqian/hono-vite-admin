export const SearchFieldType = {
  Input: 1,
  Single: 2,
  Multi: 3,
} as const

export type SearchFieldTypeValue = (typeof SearchFieldType)[keyof typeof SearchFieldType]

export interface DataTableSearchOption {
  label: string
  value: string
}

export interface DataTableSearchField {
  key: string
  type: SearchFieldTypeValue
  label?: string
  placeholder?: string
  options?: DataTableSearchOption[]
  defaultValue?: string | string[] | null
}

export interface DataTableColumn<TData> {
  header: string
  key: keyof TData & string
  pin?: 'left' | 'right'
  sortable?: boolean
  visible?: boolean
  configurable?: boolean
  cell?: (row: TData, value: unknown) => unknown
}

export interface DataTableOperations {
  header?: string
  pin?: 'left' | 'right'
}
