import { getAppConfig } from '@admin/client'
import { READ_ONLY_MODE_MESSAGE } from '@admin/lib/read-only'
import { defineStore } from 'pinia'

export const DEFAULT_SITE_NAME = 'User Admin'
export const DEFAULT_LOGIN_TITLE = 'Sign in to Admin'
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

export const useAppConfigStore = defineStore('app-config', {
  state: () => ({
    readOnlyMode: false,
    readOnlyMessage: READ_ONLY_MODE_MESSAGE,
    siteName: DEFAULT_SITE_NAME,
    loginTitle: DEFAULT_LOGIN_TITLE,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    hasLoaded: false,
    fetchPromise: null as Promise<void> | null,
  }),

  actions: {
    async fetchConfig(force = false): Promise<void> {
      if (this.fetchPromise && !force) {
        return this.fetchPromise
      }

      this.fetchPromise = (async () => {
        try {
          const response = await getAppConfig<true>()
          this.readOnlyMode = response.data.readOnlyMode
          this.readOnlyMessage = response.data.readOnlyMessage || READ_ONLY_MODE_MESSAGE
          this.siteName = response.data.siteName || DEFAULT_SITE_NAME
          this.loginTitle = response.data.loginTitle || DEFAULT_LOGIN_TITLE
          this.defaultPageSize = response.data.defaultPageSize || DEFAULT_PAGE_SIZE
          this.pageSizeOptions = response.data.pageSizeOptions.length > 0
            ? response.data.pageSizeOptions
            : DEFAULT_PAGE_SIZE_OPTIONS
        }
        catch {
          this.readOnlyMode = false
          this.readOnlyMessage = READ_ONLY_MODE_MESSAGE
          this.siteName = DEFAULT_SITE_NAME
          this.loginTitle = DEFAULT_LOGIN_TITLE
          this.defaultPageSize = DEFAULT_PAGE_SIZE
          this.pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
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
