import { prisma } from '@server/src/lib/prisma'
import { APP_CONFIG_KEYS } from '@server/src/modules/app/app.config'
import { appService } from '@server/src/modules/app/app.service'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

const APP_CONFIG_KEY_VALUES = Object.values(APP_CONFIG_KEYS)

describe('app service', () => {
  beforeEach(async () => {
    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: APP_CONFIG_KEY_VALUES,
        },
      },
    })
  })

  afterEach(async () => {
    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: APP_CONFIG_KEY_VALUES,
        },
      },
    })
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
