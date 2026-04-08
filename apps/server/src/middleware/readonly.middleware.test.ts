import { BusinessError } from '@server/src/common/exception'
import { holdContext } from '@server/src/middleware/context.middleware'
import { createReadOnlyMiddleware, shouldAllowReadOnlyRequest } from '@server/src/middleware/readonly.middleware'
import { describe, expect, it, mock } from 'bun:test'

function createContext(method: string, path: string) {
  return {
    req: {
      method,
      path,
    },
    get(key: string) {
      if (key === 'requestId') {
        return 'req-1'
      }

      return undefined
    },
  } as any
}

describe('read-only middleware', () => {
  it('allows safe requests in read-only mode', async () => {
    const middleware = createReadOnlyMiddleware(() => true)
    const next = mock(async () => {})
    const context = createContext('GET', '/api/v1/user/page')

    await holdContext(context, async () => {
      await middleware(context, next)
    })

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('allows auth session mutations in read-only mode', async () => {
    const middleware = createReadOnlyMiddleware(() => true)
    const next = mock(async () => {})
    const context = createContext('POST', '/api/v1/auth/login')

    await holdContext(context, async () => {
      await middleware(context, next)
    })

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('blocks business mutations in read-only mode', async () => {
    const middleware = createReadOnlyMiddleware(() => true)
    const next = mock(async () => {})
    const context = createContext('POST', '/api/v1/user')
    let error: unknown

    try {
      await holdContext(context, async () => {
        await middleware(context, next)
      })
    }
    catch (caughtError) {
      error = caughtError
    }

    expect(next).not.toHaveBeenCalled()
    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('ReadOnlyModeEnabled')
  })

  it('allows mutations when read-only mode is disabled', async () => {
    const middleware = createReadOnlyMiddleware(() => false)
    const next = mock(async () => {})
    const context = createContext('DELETE', '/api/v1/role/role-1')

    await holdContext(context, async () => {
      await middleware(context, next)
    })

    expect(next).toHaveBeenCalledTimes(1)
  })
})

describe('shouldAllowReadOnlyRequest', () => {
  it('treats safe methods as allowed', () => {
    expect(shouldAllowReadOnlyRequest('get', '/api/v1/user/page')).toBe(true)
    expect(shouldAllowReadOnlyRequest('OPTIONS', '/api/v1/user')).toBe(true)
  })

  it('allows only the auth session mutation allowlist', () => {
    expect(shouldAllowReadOnlyRequest('POST', '/api/v1/auth/refresh')).toBe(true)
    expect(shouldAllowReadOnlyRequest('POST', '/api/v1/user')).toBe(false)
  })
})
