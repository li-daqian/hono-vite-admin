import type { UserCreateRequest, UserCreateResponse, UserPaginationRequest, UserPaginationResponse, UserProfileResponse } from '@server/src/schemas/user.schema'
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
      ...(status ? { status } : {}),
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

  private async isUsernameUnique(username: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })
    return existingUser === null
  }
}

export const userService = new UserService()
