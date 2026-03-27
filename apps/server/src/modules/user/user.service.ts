import type { UserStatus } from '@server/generated/prisma/enums'
import type {
  UserBatchDeleteResponse,
  UserBatchStatusUpdateResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserPaginationRequest,
  UserPaginationResponse,
  UserProfileResponse,
  UserRolesUpdateRequest,
  UserUpdateRequest,
} from '@server/src/modules/user/user.schema'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { buildOrderBy, paginate } from '@server/src/utils/pagination'
import bcrypt from 'bcryptjs'

class UserService {
  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    if (!(await this.isUsernameUnique(request.username))) {
      throw BusinessError.UsernameAlreadyExists()
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(request.password, salt)

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        username: request.username,
        password: hashedPassword,
        salt,
        email: request.email,
        phone: request.phone,
        displayName: request.displayName,
      },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // Remove sensitive info before returning
    const { password, salt: userSalt, ...safeUser } = user
    return {
      ...safeUser,
      roles: user.roles.map(item => item.role.name),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const { password, salt, ...safeUser } = user
    return {
      ...safeUser,
      roles: user.roles.map(item => item.role.name),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async getUserPage(query: UserPaginationRequest): Promise<UserPaginationResponse> {
    const { page, pageSize, search, status, sort } = query
    const skip = (page - 1) * pageSize

    const where = {
      ...(status && { status: { in: status } }),
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
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
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

    const items = users.map(user => ({
      ...user,
      roles: user.roles.map(item => item.role.name),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: request.username,
        email: request.email,
        phone: request.phone,
        displayName: request.displayName,
        status: request.status,
      },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const { password, salt, ...safeUser } = updatedUser
    return {
      ...safeUser,
      roles: updatedUser.roles.map(item => item.role.name),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    }
  }

  async updateUserRoles(userId: string, request: UserRolesUpdateRequest): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const roleIds = await this.resolveRoleIdsByNames(request.roles)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          deleteMany: {},
          create: roleIds.map(roleId => ({
            role: {
              connect: { id: roleId },
            },
          })),
        },
      },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const { password, salt, ...safeUser } = updatedUser
    return {
      ...safeUser,
      roles: updatedUser.roles.map(item => item.role.name),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    }
  }

  async deleteUsers(userIds: string[]): Promise<UserBatchDeleteResponse> {
    const uniqueUserIds = [...new Set(userIds)]
    if (uniqueUserIds.length === 0) {
      throw BusinessError.BadRequest('userIds must not be empty')
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: uniqueUserIds } },
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

    const result = await prisma.user.updateMany({
      where: { id: { in: uniqueUserIds } },
      data: { status },
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

  private async resolveRoleIdsByNames(roleNames: string[]): Promise<string[]> {
    const normalizedRoleNames = [...new Set(roleNames.map(roleName => roleName.trim()).filter(Boolean))]
    if (normalizedRoleNames.length === 0) {
      return []
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: normalizedRoleNames.map(roleName => ({
          name: {
            equals: roleName,
            mode: 'insensitive',
          },
        })),
      },
      select: {
        id: true,
        name: true,
      },
    })

    const foundRoleNames = new Set(roles.map(role => role.name.trim().toLowerCase()))
    const missingRoles = normalizedRoleNames.filter(roleName => !foundRoleNames.has(roleName.toLowerCase()))
    if (missingRoles.length > 0) {
      throw BusinessError.BadRequest(`Roles not found: ${missingRoles.join(', ')}`)
    }

    return roles.map(role => role.id)
  }
}

export const userService = new UserService()
