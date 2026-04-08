import { BusinessError } from '@server/src/common/exception'
import { holdContext } from '@server/src/middleware/context.middleware'
import { requireActionPermission } from '@server/src/middleware/permission.middleware'
import { describe, expect, it, mock } from 'bun:test'

function createContext(userId = 'user-1') {
  return {
    get(key: string) {
      if (key === 'authPayload') {
        return { userId }
      }

      if (key === 'requestId') {
        return 'req-1'
      }

      return undefined
    },
  } as any
}

describe('permission middleware', () => {
  it('calls next when the user has the required action permission', async () => {
    const checker = {
      hasUserActionPermission: mock(async (userId: string, actionId: string) => {
        return userId === 'user-1' && actionId === 'access.users.create'
      }),
    }
    const middleware = requireActionPermission('access.users.create', checker)
    const next = mock(async () => {})
    const context = createContext()

    await holdContext(context, async () => {
      await middleware(context, next)
    })

    expect(checker.hasUserActionPermission).toHaveBeenCalledWith('user-1', 'access.users.create')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('throws a forbidden business error when the user lacks the required action permission', async () => {
    const checker = {
      hasUserActionPermission: mock(async () => false),
    }
    const middleware = requireActionPermission('access.roles.permissions', checker)
    const next = mock(async () => {})
    const context = createContext()
    let error: unknown

    try {
      await holdContext(context, async () => {
        await middleware(context, next)
      })
    }
    catch (caughtError) {
      error = caughtError
    }

    expect(checker.hasUserActionPermission).toHaveBeenCalledWith('user-1', 'access.roles.permissions')
    expect(next).not.toHaveBeenCalled()
    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('PermissionDenied')
  })
})
