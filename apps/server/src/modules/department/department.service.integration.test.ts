import { randomUUID } from 'node:crypto'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { holdContext } from '@server/src/middleware/context.middleware'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { departmentService } from './department.service'

function createContext(userId: string, requestId: string) {
  return {
    req: {
      method: 'PUT',
      path: '/api/v1/department/target-id/users',
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

describe('department service', () => {
  let operatorUserId: string
  let departmentId: string
  let requestId: string
  let userIds: string[] = []

  beforeEach(async () => {
    requestId = `req-${randomUUID()}`
    const { hashedPassword, salt } = await createPasswordHash('Password123!')

    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: `department-operator-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Department Operator',
        },
      }),
      prisma.user.create({
        data: {
          username: `department-user-a-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Department User A',
          email: 'department-user-a@example.com',
        },
      }),
      prisma.user.create({
        data: {
          username: `department-user-b-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Department User B',
          email: 'department-user-b@example.com',
        },
      }),
      prisma.user.create({
        data: {
          username: `department-user-c-${randomUUID()}`,
          password: hashedPassword,
          salt,
          displayName: 'Department User C',
        },
      }),
    ])

    operatorUserId = users[0]!.id
    userIds = users.slice(1).map(user => user.id)

    const department = await prisma.department.create({
      data: {
        name: `Assignment ${randomUUID()}`,
        order: 1,
      },
    })
    departmentId = department.id
  })

  afterEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { requestId },
    })
    await prisma.userDepartment.deleteMany({
      where: {
        OR: [
          { userId: { in: [operatorUserId, ...userIds] } },
          { departmentId },
        ],
      },
    })
    await prisma.user.deleteMany({
      where: {
        id: { in: [operatorUserId, ...userIds] },
      },
    })
    await prisma.department.deleteMany({
      where: { id: departmentId },
    })
  })

  it('lists users assigned to a department', async () => {
    await prisma.userDepartment.createMany({
      data: userIds.slice(0, 2).map(userId => ({
        departmentId,
        userId,
      })),
    })

    const users = await departmentService.getDepartmentUsers(departmentId)

    expect(users.map(user => user.id).sort()).toEqual(userIds.slice(0, 2).sort())
    expect(users.every(user => user.username.length > 0)).toBe(true)
  })

  it('replaces and clears department user assignments', async () => {
    await prisma.userDepartment.create({
      data: {
        departmentId,
        userId: userIds[0]!,
      },
    })

    let updated: Awaited<ReturnType<typeof departmentService.assignDepartmentUsers>> | undefined
    await holdContext(createContext(operatorUserId, requestId), async () => {
      updated = await departmentService.assignDepartmentUsers(departmentId, {
        userIds: [userIds[1]!, userIds[2]!, userIds[1]!],
      })
    })

    const assignments = await prisma.userDepartment.findMany({
      where: { departmentId },
      orderBy: { userId: 'asc' },
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        requestId,
        action: 'assign-users',
      },
    })

    expect(updated!.updatedCount).toBe(2)
    expect(updated!.users.map(user => user.id).sort()).toEqual(userIds.slice(1, 3).sort())
    expect(assignments.map(assignment => assignment.userId)).toEqual(userIds.slice(1, 3).sort())
    expect(auditLog?.requestSnapshot).toEqual({
      id: departmentId,
      userIds: userIds.slice(1, 3),
    })

    await holdContext(createContext(operatorUserId, requestId), async () => {
      updated = await departmentService.assignDepartmentUsers(departmentId, {
        userIds: [],
      })
    })

    const remainingAssignments = await prisma.userDepartment.count({
      where: { departmentId },
    })

    expect(updated!.updatedCount).toBe(0)
    expect(updated!.users).toEqual([])
    expect(remainingAssignments).toBe(0)
  })

  it('rejects assigning a missing user', async () => {
    let error: unknown

    await holdContext(createContext(operatorUserId, requestId), async () => {
      try {
        await departmentService.assignDepartmentUsers(departmentId, {
          userIds: [randomUUID()],
        })
      }
      catch (caughtError) {
        error = caughtError
      }
    })

    const remainingAssignments = await prisma.userDepartment.count({
      where: { departmentId },
    })

    expect(error).toBeInstanceOf(BusinessError)
    expect((error as BusinessError).toString()).toContain('UserNotFound')
    expect(remainingAssignments).toBe(0)
  })
})
