import { randomUUID } from 'node:crypto'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash, verifyPassword } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { userService } from './user.service'

function createContext(userId: string, requestId: string) {
  return {
    req: {
      method: 'POST',
      path: '/api/v1/user/target-id/password',
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

describe('user service', () => {
  let operatorUserId: string
  let targetUserId: string
  let requestId: string

  beforeEach(async () => {
    requestId = `req-${randomUUID()}`
    const { hashedPassword, salt } = await createPasswordHash('OldPassword123!')

    const [operatorUser, targetUser] = await Promise.all([
      prisma.user.create({
        data: {
          username: `operator-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Password Operator',
        },
      }),
      prisma.user.create({
        data: {
          username: `target-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Password Target',
        },
      }),
    ])

    operatorUserId = operatorUser.id
    targetUserId = targetUser.id
  })

  afterEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { requestId },
    })
    await prisma.refreshToken.deleteMany({
      where: {
        userId: { in: [operatorUserId, targetUserId] },
      },
    })
    await prisma.user.deleteMany({
      where: {
        id: { in: [operatorUserId, targetUserId] },
      },
    })
  })

  it('updates another user password and revokes refresh tokens', async () => {
    const previousUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    })

    await prisma.refreshToken.create({
      data: {
        userId: targetUserId,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    await holdContext(createContext(operatorUserId, requestId), async () => {
      await userService.updateUserPassword(targetUserId, {
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      })
    })

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    })
    const remainingRefreshTokens = await prisma.refreshToken.count({
      where: { userId: targetUserId },
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'update-password',
      },
    })

    expect(updatedUser.password).not.toBe(previousUser.password)
    expect(updatedUser.salt).not.toBe(previousUser.salt)
    expect(await verifyPassword('OldPassword123!', updatedUser.password, updatedUser.salt)).toBe(false)
    expect(await verifyPassword('NewPassword123!', updatedUser.password, updatedUser.salt)).toBe(true)
    expect(remainingRefreshTokens).toBe(0)
    expect(auditLog?.requestSnapshot).toEqual({
      targetUserId,
      result: 'success',
      revokedRefreshTokenCount: 1,
    })
  })

  it('rejects updating the password of a missing user', async () => {
    let error: unknown

    await holdContext(createContext(operatorUserId, requestId), async () => {
      try {
        await userService.updateUserPassword(randomUUID(), {
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'update-password',
      },
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('User not found')
    expect(auditLog).toBeNull()
  })
})
