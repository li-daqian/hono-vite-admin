import { appService } from '@server/src/modules/app/app.service'
import { afterEach, describe, expect, it } from 'bun:test'

describe('app service', () => {
  afterEach(() => {
    delete process.env.READ_ONLY_MODE
  })

  it('returns read-only bootstrap config when read-only mode is enabled', () => {
    process.env.READ_ONLY_MODE = 'true'

    expect(appService.getConfig()).toEqual({
      readOnlyMode: true,
      readOnlyMessage: 'Demo read-only',
    })
  })

  it('returns writable bootstrap config when read-only mode is disabled', () => {
    process.env.READ_ONLY_MODE = 'false'

    expect(appService.getConfig()).toEqual({
      readOnlyMode: false,
      readOnlyMessage: 'Demo read-only',
    })
  })
})
