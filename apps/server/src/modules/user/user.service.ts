import type { UserStatus } from '@server/generated/prisma/enums'
import type {
  UserBatchDeleteResponse,
  UserBatchStatusUpdateResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserPaginationRequest,
  UserPaginationResponse,
  UserProfileResponse,
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

  private mapUserRoles<T extends { roles: Array<{ role: { id: string, name: string } }>, createdAt: Date, updatedAt: Date }>(user: T) {
    return {
      ...user,
      roles: user.roles.map(item => ({
        id: item.role.id,
        name: item.role.name,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    if (!(await this.isUsernameUnique(request.username))) {
      throw BusinessError.UsernameAlreadyExists()
    }

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
    return this.mapUserRoles(safeUser)
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: this.userRoleSelection,
        },
      },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const { password, salt, ...safeUser } = user
    return this.mapUserRoles(safeUser)
  }

  async getUserPage(query: UserPaginationRequest): Promise<UserPaginationResponse> {
    const { page, pageSize, search, status, roleIds, sort } = query
    const skip = (page - 1) * pageSize

    const where = {
      ...(status && { status: { in: status } }),
      ...(roleIds && roleIds.length > 0 && {
        roles: { some: { roleId: { in: roleIds } } },
      }),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
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
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const items = users.map(user => this.mapUserRoles(user))

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

    const updatedUser = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: userId },
        data: {
          username: request.username,
          email: request.email,
          phone: request.phone,
          displayName: request.displayName,
          status: request.status,
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
    return this.mapUserRoles(safeUser)
  }

  async deleteUsers(userIds: string[]): Promise<UserBatchDeleteResponse> {
    const uniqueUserIds = [...new Set(userIds)]
    if (uniqueUserIds.length === 0) {
      throw BusinessError.BadRequest('userIds must not be empty')
    }

    const result = await prisma.$transaction(async (tx) => {
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
}

export const userService = new UserService()
