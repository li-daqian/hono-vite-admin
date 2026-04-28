import { getAppConfig } from '@admin/client'
import { READ_ONLY_MODE_MESSAGE } from '@admin/lib/read-only'
import { defineStore } from 'pinia'

export const useAppConfigStore = defineStore('app-config', {
  state: () => ({
    readOnlyMode: false,
    readOnlyMessage: READ_ONLY_MODE_MESSAGE,
    hasLoaded: false,
    fetchPromise: null as Promise<void> | null,
  }),

  actions: {
    async fetchConfig(): Promise<void> {
      if (this.fetchPromise) {
        return this.fetchPromise
      }

      this.fetchPromise = (async () => {
        try {
          const response = await getAppConfig<true>()
          this.readOnlyMode = response.data.readOnlyMode
          this.readOnlyMessage = response.data.readOnlyMessage || READ_ONLY_MODE_MESSAGE
        }
        catch {
          this.readOnlyMode = false
          this.readOnlyMessage = READ_ONLY_MODE_MESSAGE
        }
        finally {
          this.hasLoaded = true
          this.fetchPromise = null
        }
      })()

      return this.fetchPromise
    },
  },
})
