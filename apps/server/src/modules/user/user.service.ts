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
    })

    // Remove sensitive info before returning
    const { password, salt: userSalt, ...safeUser } = user
    return {
      ...safeUser,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const { password, salt, ...safeUser } = user
    return {
      ...safeUser,
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
    })

    const { password, salt, ...safeUser } = updatedUser
    return {
      ...safeUser,
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
}

export const userService = new UserService()
