import { randomUUID } from 'node:crypto'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash, verifyPassword } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { SECURITY_POLICY_CONFIG_KEYS } from '@server/src/modules/app/app.service'
import { authService } from '@server/src/modules/auth/auth.service'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

const SECURITY_POLICY_KEYS = Object.values(SECURITY_POLICY_CONFIG_KEYS)

function createContext(userId: string, requestId: string, path = '/api/v1/auth/change-password') {
  return {
    req: {
      method: 'POST',
      path,
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

describe('auth service', () => {
  let userId: string
  let username: string
  let requestId: string

  beforeEach(async () => {
    requestId = `req-${randomUUID()}`
    await prisma.sysConfig.deleteMany({
      where: {
        key: {
          in: SECURITY_POLICY_KEYS,
        },
      },
    })

    const { hashedPassword, salt } = await createPasswordHash('OldPassword123!')
    username = `auth-${randomUUID()}`
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        salt,
        displayName: 'Password Test User',
      },
    })

    userId = user.id
  })

  afterEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { requestId },
    })
    await prisma.refreshToken.deleteMany({
      where: { userId },
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
  })

  it('changes the current user password', async () => {
    const previousUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    await holdContext(createContext(userId, requestId), async () => {
      await authService.changePassword(userId, {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      })
    })

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'change-password',
      },
    })

    expect(updatedUser.password).not.toBe(previousUser.password)
    expect(updatedUser.salt).not.toBe(previousUser.salt)
    expect(await verifyPassword('OldPassword123!', updatedUser.password, updatedUser.salt)).toBe(false)
    expect(await verifyPassword('NewPassword123!', updatedUser.password, updatedUser.salt)).toBe(true)
    expect(auditLog?.requestSnapshot).toEqual({
      userId,
      result: 'success',
    })
  })

  it('rejects an incorrect current password', async () => {
    const previousUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })

    let error: unknown

    await holdContext(createContext(userId, requestId), async () => {
      try {
        await authService.changePassword(userId, {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    const unchangedUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'change-password-failed',
      },
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('CurrentPasswordIncorrect')
    expect(unchangedUser.password).toBe(previousUser.password)
    expect(unchangedUser.salt).toBe(previousUser.salt)
    expect(await verifyPassword('OldPassword123!', unchangedUser.password, unchangedUser.salt)).toBe(true)
    expect(await verifyPassword('NewPassword123!', unchangedUser.password, unchangedUser.salt)).toBe(false)
    expect(auditLog?.requestSnapshot).toEqual({
      userId,
      result: 'failure',
      reason: 'current-password-incorrect',
    })
  })

  it('locks the account after repeated login failures and clears the lock after a successful login', async () => {
    const originalLoginMaxFailedAttempts = process.env.LOGIN_MAX_FAILED_ATTEMPTS
    const originalLoginLockDuration = process.env.LOGIN_LOCK_DURATION
    process.env.LOGIN_MAX_FAILED_ATTEMPTS = '5'
    process.env.LOGIN_LOCK_DURATION = '15m'
    await prisma.sysConfig.createMany({
      data: [
        {
          key: SECURITY_POLICY_CONFIG_KEYS.maxFailedLoginAttempts,
          value: '2',
        },
        {
          key: SECURITY_POLICY_CONFIG_KEYS.loginLockDuration,
          value: '15m',
        },
      ],
    })

    try {
      let firstError: unknown
      let lockError: unknown
      let lockedPasswordError: unknown

      await holdContext(createContext(userId, requestId, '/api/v1/auth/login'), async () => {
        try {
          await authService.login({
            username,
            password: 'WrongPassword123!',
          })
        }
        catch (caughtError) {
          firstError = caughtError
        }

        try {
          await authService.login({
            username,
            password: 'WrongPassword123!',
          })
        }
        catch (caughtError) {
          lockError = caughtError
        }

        try {
          await authService.login({
            username,
            password: 'OldPassword123!',
          })
        }
        catch (caughtError) {
          lockedPasswordError = caughtError
        }
      })

      const lockedUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      })
      const refreshTokensWhileLocked = await prisma.refreshToken.count({
        where: { userId },
      })

      expect(firstError).toBeInstanceOf(BusinessError)
      expect((firstError as BusinessError).toString()).toContain('UserOrPasswordIncorrect')
      expect((firstError as BusinessError).toString()).toContain('1 attempt remains before this account is locked')
      expect(lockError).toBeInstanceOf(BusinessError)
      expect((lockError as BusinessError).toString()).toContain('UserAccountLocked')
      expect(lockedPasswordError).toBeInstanceOf(BusinessError)
      expect((lockedPasswordError as BusinessError).toString()).toContain('UserAccountLocked')
      expect(lockedUser.failedLoginAttempts).toBe(2)
      expect(lockedUser.lockedUntil).toBeInstanceOf(Date)
      expect(lockedUser.lockedUntil!.getTime()).toBeGreaterThan(Date.now())
      expect(refreshTokensWhileLocked).toBe(0)

      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() - 1_000),
        },
      })

      await holdContext(createContext(userId, requestId, '/api/v1/auth/login'), async () => {
        await authService.login({
          username,
          password: 'OldPassword123!',
        })
      })

      const unlockedUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      })
      const refreshTokensAfterLogin = await prisma.refreshToken.count({
        where: { userId },
      })

      expect(unlockedUser.failedLoginAttempts).toBe(0)
      expect(unlockedUser.lockedUntil).toBeNull()
      expect(refreshTokensAfterLogin).toBe(1)
    }
    finally {
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
    }
  })
})
