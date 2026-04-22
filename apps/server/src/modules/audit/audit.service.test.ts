import { holdContext } from '@server/src/middleware/context.middleware'
import { auditService } from '@server/src/modules/audit/audit.service'
import { afterEach, describe, expect, it, mock } from 'bun:test'

function createContext() {
  return {
    req: {
      method: 'POST',
      path: '/api/v1/auth/login',
      header(name: string) {
        const headers: Record<string, string | undefined> = {
          'cf-connecting-ip': undefined,
          'x-forwarded-for': '203.0.113.10, 70.41.3.18',
          'x-real-ip': undefined,
          'forwarded': undefined,
          'user-agent': 'bun:test',
        }

        return headers[name.toLowerCase()]
      },
    },
    get(key: string) {
      if (key === 'requestId') {
        return 'req-test'
      }

      return undefined
    },
  } as any
}

describe('audit service', () => {
  afterEach(() => {
    delete process.env.READ_ONLY_MODE
  })

  it('skips audit writes in read-only mode', async () => {
    process.env.READ_ONLY_MODE = 'true'
    const create = mock(async () => ({}))

    await holdContext(createContext(), async () => {
      await auditService.record({
        auditLog: { create },
      } as any, {
        category: 'login',
        module: 'auth',
        action: 'login-success',
        operator: {
          operatorId: 'user-1',
          operatorUsername: 'admin',
          operatorDisplayName: 'Administrator',
        },
      })
    })

    expect(create).not.toHaveBeenCalled()
  })

  it('writes audit logs when read-only mode is disabled', async () => {
    process.env.READ_ONLY_MODE = 'false'
    const create = mock(async () => ({}))

    await holdContext(createContext(), async () => {
      await auditService.record({
        auditLog: { create },
      } as any, {
        category: 'login',
        module: 'auth',
        action: 'login-success',
        operator: {
          operatorId: 'user-1',
          operatorUsername: 'admin',
          operatorDisplayName: 'Administrator',
        },
      })
    })

    expect(create).toHaveBeenCalledTimes(1)
  })
})
