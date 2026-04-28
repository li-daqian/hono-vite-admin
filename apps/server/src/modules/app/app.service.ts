import type { AppConfigResponse } from '@server/src/modules/app/app.schema'
import { getEnv } from '@server/src/lib/env'

export const APP_READ_ONLY_MESSAGE = 'Demo read-only'

export const appService = {
  getConfig(): AppConfigResponse {
    return {
      readOnlyMode: getEnv().deployment.readOnlyMode,
      readOnlyMessage: APP_READ_ONLY_MESSAGE,
    }
  },
}
