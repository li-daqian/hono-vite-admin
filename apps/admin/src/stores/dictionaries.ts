import type { DictItemResponseSchema } from '@admin/client'
import type { DictionaryOption } from '@admin/lib/dictionary'
import { getSystemDictItemsPage } from '@admin/client'
import { formatDictionaryFallback } from '@admin/lib/dictionary'
import { defineStore } from 'pinia'

const DEFAULT_OPTIONS: Record<string, DictionaryOption[]> = {
  user_status: [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'DISABLED', label: 'Disabled', color: 'zinc' },
  ],
  audit_module: [
    { value: 'auth', label: 'Authentication', color: 'blue' },
    { value: 'user', label: 'Users', color: 'green' },
    { value: 'role', label: 'Roles', color: 'violet' },
    { value: 'department', label: 'Departments', color: 'amber' },
    { value: 'system-config', label: 'System Config', color: 'red' },
    { value: 'dictionary', label: 'Dictionaries', color: 'slate' },
  ],
}

function mapItem(item: DictItemResponseSchema): DictionaryOption {
  return {
    value: item.value,
    label: item.label,
    color: item.color,
  }
}

export const useDictionaryStore = defineStore('dictionaries', {
  state: () => ({
    itemsByType: {} as Record<string, DictionaryOption[]>,
    fetchPromises: {} as Record<string, Promise<void> | undefined>,
  }),

  actions: {
    async fetchType(typeCode: string, force = false): Promise<void> {
      if (this.fetchPromises[typeCode] && !force) {
        return this.fetchPromises[typeCode]
      }

      this.fetchPromises[typeCode] = (async () => {
        try {
          const response = await getSystemDictItemsPage<true>({
            query: {
              page: 1,
              pageSize: 100,
              sort: 'order asc,value asc',
              typeCode,
              status: ['ACTIVE'],
            },
          })

          this.itemsByType[typeCode] = response.data.items.map(mapItem)
        }
        catch {
          this.itemsByType[typeCode] = DEFAULT_OPTIONS[typeCode] ?? []
        }
        finally {
          this.fetchPromises[typeCode] = undefined
        }
      })()

      return this.fetchPromises[typeCode]
    },

    async fetchTypes(typeCodes: string[], force = false): Promise<void> {
      await Promise.all(typeCodes.map(typeCode => this.fetchType(typeCode, force)))
    },

    getOptions(typeCode: string): DictionaryOption[] {
      return this.itemsByType[typeCode]?.length
        ? this.itemsByType[typeCode]!
        : (DEFAULT_OPTIONS[typeCode] ?? [])
    },

    getOption(typeCode: string, value: string): DictionaryOption {
      return this.getOptions(typeCode).find(item => item.value === value) ?? {
        value,
        label: formatDictionaryFallback(value),
        color: 'slate',
      }
    },
  },
})
