import { randomUUID } from 'node:crypto'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash, verifyPassword } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { authService } from '@server/src/modules/auth/auth.service'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

function createContext(userId: string, requestId: string) {
  return {
    req: {
      method: 'POST',
      path: '/api/v1/auth/change-password',
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
  let requestId: string

  beforeEach(async () => {
    requestId = `req-${randomUUID()}`
    const { hashedPassword, salt } = await createPasswordHash('OldPassword123!')
    const user = await prisma.user.create({
      data: {
        username: `change-password-${randomUUID()}`,
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
})
