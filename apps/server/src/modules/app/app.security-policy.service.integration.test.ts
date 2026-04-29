import { randomUUID } from 'node:crypto'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { appService, SECURITY_POLICY_CONFIG_KEYS } from '@server/src/modules/app/app.service'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

const SECURITY_POLICY_KEYS = Object.values(SECURITY_POLICY_CONFIG_KEYS)

function createContext(userId: string, requestId: string) {
  return {
    req: {
      method: 'PUT',
      path: '/api/v1/app/security-policy',
      header(name: string) {
        const headers: Record<string, string | undefined> = {
          'cf-connecting-ip': undefined,
          'x-forwarded-for': '203.0.113.10',
          'x-real-ip': undefined,
          'forwarded': undefined,
          'user-agent': 'bun:test',
        }

        return headers[name.toLowerCase()]
      },
    },
    get(key: string) {
      if (key === 'authPayload') {
        return { userId }
      }

      if (key === 'requestId') {
        return requestId
      }

      return undefined
    },
  } as any
}

describe('app security policy service', () => {
  let originalLoginMaxFailedAttempts: string | undefined
  let originalLoginLockDuration: string | undefined
  let originalReadOnlyMode: string | undefined
  let originalNodeEnv: string | undefined
  let userId: string
  let requestId: string

  beforeEach(async () => {
    originalLoginMaxFailedAttempts = process.env.LOGIN_MAX_FAILED_ATTEMPTS
    originalLoginLockDuration = process.env.LOGIN_LOCK_DURATION
    originalReadOnlyMode = process.env.READ_ONLY_MODE
    originalNodeEnv = process.env.NODE_ENV

    process.env.LOGIN_MAX_FAILED_ATTEMPTS = '5'
    process.env.LOGIN_LOCK_DURATION = '15m'
    process.env.READ_ONLY_MODE = 'false'
    process.env.NODE_ENV = 'development'

    requestId = `req-${randomUUID()}`
    const { hashedPassword, salt } = await createPasswordHash('Password123!')
    const user = await prisma.user.create({
      data: {
        username: `security-policy-${randomUUID()}`,
        password: hashedPassword,
        salt,
        displayName: 'Security Policy Test User',
      },
    })

    userId = user.id

    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: SECURITY_POLICY_KEYS,
        },
      },
    })
  })

  afterEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { requestId },
    })
    await prisma.user.deleteMany({
      where: { id: userId },
    })
    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: SECURITY_POLICY_KEYS,
        },
      },
    })

    if (originalLoginMaxFailedAttempts === undefined) {
      delete process.env.LOGIN_MAX_FAILED_ATTEMPTS
    }
    else {
      process.env.LOGIN_MAX_FAILED_ATTEMPTS = originalLoginMaxFailedAttempts
    }

    if (originalLoginLockDuration === undefined) {
      delete process.env.LOGIN_LOCK_DURATION
    }
    else {
      process.env.LOGIN_LOCK_DURATION = originalLoginLockDuration
    }

    if (originalReadOnlyMode === undefined) {
      delete process.env.READ_ONLY_MODE
    }
    else {
      process.env.READ_ONLY_MODE = originalReadOnlyMode
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    }
    else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('returns environment defaults when no stored policy exists', async () => {
    expect(await appService.getSecurityPolicy()).toEqual({
      maxFailedLoginAttempts: 5,
      loginLockDuration: '15m',
      editable: true,
    })
  })

  it('updates and returns the stored policy in local development', async () => {
    await holdContext(createContext(userId, requestId), async () => {
      const policy = await appService.updateSecurityPolicy({
        maxFailedLoginAttempts: 3,
        loginLockDuration: '30m',
      })

      expect(policy).toEqual({
        maxFailedLoginAttempts: 3,
        loginLockDuration: '30m',
        editable: true,
      })
    })

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'update-security-policy',
      },
    })

    expect(await appService.getLoginSecurityPolicy()).toEqual({
      maxFailedLoginAttempts: 3,
      loginLockDuration: '30m',
    })
    expect(auditLog?.requestSnapshot).toEqual({
      previous: {
        maxFailedLoginAttempts: 5,
        loginLockDuration: '15m',
      },
      next: {
        maxFailedLoginAttempts: 3,
        loginLockDuration: '30m',
      },
    })
  })

  it('rejects updates in production', async () => {
    process.env.NODE_ENV = 'production'

    let error: unknown

    await holdContext(createContext(userId, requestId), async () => {
      try {
        await appService.updateSecurityPolicy({
          maxFailedLoginAttempts: 3,
          loginLockDuration: '30m',
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('SecurityPolicyReadOnly')
  })
})
