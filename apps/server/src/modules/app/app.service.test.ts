import { APP_CONFIG_KEYS } from '@server/src/modules/app/app.config'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

const APP_CONFIG_KEY_VALUES = Object.values(APP_CONFIG_KEYS)
const sysConfigFindMany = mock(async () => [] as Array<{ key: string, value: string }>)

mock.module('@server/src/lib/prisma', () => ({
  prisma: {
    sysConfig: {
      findMany: sysConfigFindMany,
    },
  },
}))

const { appService } = await import('@server/src/modules/app/app.service')

describe('app service', () => {
  beforeEach(() => {
    sysConfigFindMany.mockClear()
  })

  afterEach(() => {
    delete process.env.READ_ONLY_MODE
  })

  it('returns read-only bootstrap config when read-only mode is enabled', async () => {
    process.env.READ_ONLY_MODE = 'true'

    expect(await appService.getConfig()).toEqual({
      readOnlyMode: true,
      readOnlyMessage: 'Demo read-only',
      siteName: 'User Admin',
      loginTitle: 'Sign in to Admin',
      defaultPageSize: 10,
      pageSizeOptions: [10, 20, 30, 40, 50],
    })
    expect(sysConfigFindMany).toHaveBeenCalledWith({
      where: {
        key: {
          in: APP_CONFIG_KEY_VALUES,
        },
      },
    })
  })

  it('returns writable bootstrap config when read-only mode is disabled', async () => {
    process.env.READ_ONLY_MODE = 'false'

    expect(await appService.getConfig()).toEqual({
      readOnlyMode: false,
      readOnlyMessage: 'Demo read-only',
      siteName: 'User Admin',
      loginTitle: 'Sign in to Admin',
      defaultPageSize: 10,
      pageSizeOptions: [10, 20, 30, 40, 50],
    })
  })
})
