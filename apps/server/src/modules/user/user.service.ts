import type { UserStatus } from '@server/generated/prisma/enums'
import type {
  UserBatchDeleteResponse,
  UserBatchStatusUpdateResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserPaginationRequest,
  UserPaginationResponse,
  UserProfileResponse,
  UserUnlockResponse,
  UserUpdatePasswordRequest,
  UserUpdateRequest,
} from '@server/src/modules/user/user.schema'
import { BusinessError } from '@server/src/common/exception'
import { createPasswordHash } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { auditService } from '@server/src/modules/audit/audit.service'
import { buildOrderBy, paginate } from '@server/src/utils/pagination'

class UserService {
  private readonly userRoleSelection = {
    role: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const

  private readonly userDepartmentSelection = {
    department: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const

  private mapUser<T extends {
    roles: Array<{ role: { id: string, name: string } }>
    departments: Array<{ department: { id: string, name: string } }>
    lockedUntil: Date | null
    createdAt: Date
    updatedAt: Date
  }>(
    user: T,
  ) {
    return {
      ...user,
      roles: user.roles.map(item => ({
        id: item.role.id,
        name: item.role.name,
      })),
      departments: user.departments.map(item => ({
        id: item.department.id,
        name: item.department.name,
      })),
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    if (!(await this.isUsernameUnique(request.username))) {
      throw BusinessError.UsernameAlreadyExists()
    }
    const departmentIds = this.getUniqueIds(request.departmentIds)
    await this.ensureDepartmentsExist(departmentIds)

    // Generate salt and hash password
    const { hashedPassword, salt } = await createPasswordHash(request.password)

    // Create user in DB
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username: request.username,
          password: hashedPassword,
          salt,
          email: request.email,
          phone: request.phone,
          displayName: request.displayName,
          ...(departmentIds.length > 0 && {
            departments: {
              create: departmentIds.map(departmentId => ({
                department: { connect: { id: departmentId } },
              })),
            },
          }),
          ...(request.roleIds && request.roleIds.length > 0 && {
            roles: {
              create: request.roleIds.map(roleId => ({
                role: { connect: { id: roleId } },
              })),
            },
          }),
        },
        include: {
          roles: {
            select: this.userRoleSelection,
          },
          departments: {
            select: this.userDepartmentSelection,
          },
        },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'create',
        requestSnapshot: request,
      })

      return createdUser
    })

    // Remove sensitive info before returning
    const { password, salt: userSalt, ...safeUser } = user
    return this.mapUser(safeUser)
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: this.userRoleSelection,
        },
        departments: {
          select: this.userDepartmentSelection,
        },
      },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const { password, salt, ...safeUser } = user
    return this.mapUser(safeUser)
  }

  async getUserPage(query: UserPaginationRequest): Promise<UserPaginationResponse> {
    const { page, pageSize, search, status, roleIds, departmentIds, sort } = query
    const skip = (page - 1) * pageSize

    const where = {
      ...(status && { status: { in: status } }),
      ...(roleIds && roleIds.length > 0 && {
        roles: { some: { roleId: { in: roleIds } } },
      }),
      ...(departmentIds && departmentIds.length > 0 && {
        departments: { some: { departmentId: { in: departmentIds } } },
      }),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
              { departments: { some: { department: { name: { contains: search, mode: 'insensitive' as const } } } } },
            ],
          }
        : {}),
    }

    const orderBy = buildOrderBy(
      sort,
      ['username', 'email', 'displayName', 'status', 'createdAt', 'updatedAt'] as const,
      { createdAt: 'desc' },
    )

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          username: true,
          roles: {
            select: this.userRoleSelection,
          },
          email: true,
          phone: true,
          displayName: true,
          departments: {
            select: this.userDepartmentSelection,
          },
          status: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const items = users.map(user => this.mapUser(user))

    return paginate(items, total, query)
  }

  async updateUser(userId: string, request: UserUpdateRequest): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    if (request.username && request.username !== user.username && !(await this.isUsernameUnique(request.username))) {
      throw BusinessError.UsernameAlreadyExists()
    }
    const departmentIds = request.departmentIds === undefined
      ? undefined
      : this.getUniqueIds(request.departmentIds)
    if (departmentIds !== undefined) {
      await this.ensureDepartmentsExist(departmentIds)
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: userId },
        data: {
          username: request.username,
          email: request.email,
          phone: request.phone,
          displayName: request.displayName,
          status: request.status,
          ...(departmentIds !== undefined && {
            departments: {
              deleteMany: {},
              ...(departmentIds.length > 0 && {
                create: departmentIds.map(departmentId => ({
                  department: { connect: { id: departmentId } },
                })),
              }),
            },
          }),
          ...(request.roleIds !== undefined && {
            roles: {
              deleteMany: {},
              create: request.roleIds.map(roleId => ({
                role: {
                  connect: { id: roleId },
                },
              })),
            },
          }),
        },
        include: {
          roles: {
            select: this.userRoleSelection,
          },
          departments: {
            select: this.userDepartmentSelection,
          },
        },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'update',
        requestSnapshot: {
          id: userId,
          ...request,
        },
      })

      return nextUser
    })

    const { password, salt, ...safeUser } = updatedUser
    return this.mapUser(safeUser)
  }

  async updateUserPassword(userId: string, request: UserUpdatePasswordRequest): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const { hashedPassword, salt } = await createPasswordHash(request.newPassword)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          salt,
        },
      })

      const revokedRefreshTokens = await tx.refreshToken.deleteMany({
        where: { userId },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'update-password',
        requestSnapshot: {
          targetUserId: userId,
          result: 'success',
          revokedRefreshTokenCount: revokedRefreshTokens.count,
        },
      })
    })
  }

  async unlockUser(userId: string): Promise<UserUnlockResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'unlock',
        requestSnapshot: {
          targetUserId: userId,
          result: 'success',
          previousFailedLoginAttempts: user.failedLoginAttempts,
          previousLockedUntil: user.lockedUntil?.toISOString() ?? null,
        },
      })
    })

    return {}
  }

  async deleteUsers(userIds: string[]): Promise<UserBatchDeleteResponse> {
    const uniqueUserIds = [...new Set(userIds)]
    if (uniqueUserIds.length === 0) {
      throw BusinessError.BadRequest('userIds must not be empty')
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.userDepartment.deleteMany({
        where: { userId: { in: uniqueUserIds } },
      })

      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: uniqueUserIds } },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'batch-delete',
        requestSnapshot: { userIds: uniqueUserIds },
      })

      return deletedUsers
    })

    return {
      deletedCount: result.count,
    }
  }

  async updateUsersStatus(userIds: string[], status: UserStatus): Promise<UserBatchStatusUpdateResponse> {
    const uniqueUserIds = [...new Set(userIds)]
    if (uniqueUserIds.length === 0) {
      throw BusinessError.BadRequest('userIds must not be empty')
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUsers = await tx.user.updateMany({
        where: { id: { in: uniqueUserIds } },
        data: { status },
      })

      await auditService.record(tx, {
        module: 'user',
        action: 'status-update',
        requestSnapshot: { userIds: uniqueUserIds, status },
      })

      return updatedUsers
    })

    return {
      updatedCount: result.count,
    }
  }

  private async isUsernameUnique(username: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })
    return existingUser === null
  }

  private getUniqueIds(ids: string[] | undefined): string[] {
    return [...new Set(ids ?? [])]
  }

  private async ensureDepartmentsExist(departmentIds: string[]): Promise<void> {
    if (departmentIds.length === 0) {
      return
    }

    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    })
    if (departments.length !== departmentIds.length) {
      throw BusinessError.BadRequest('One or more departments were not found', 'DepartmentNotFound')
    }
  }
}

export const userService = new UserService()
