import type { UserCreateRequest, UserCreateResponse, UserPaginationRequest, UserPaginationResponse, UserProfileResponse } from '@server/src/schemas/user.schema'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { paginate } from '@server/src/utils/pagination'
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

    let orderBy:
      | { username: 'asc' | 'desc' }
      | { email: 'asc' | 'desc' }
      | { displayName: 'asc' | 'desc' }
      | { status: 'asc' | 'desc' }
      | { createdAt: 'asc' | 'desc' }
      | { updatedAt: 'asc' | 'desc' } = { createdAt: 'desc' }

    if (sort) {
      const [field, direction, ...rest] = sort.trim().split(/\s+/)
      if (!field || !direction || rest.length > 0) {
        throw BusinessError.BadRequest('Invalid sort format. Use "field direction", e.g. "createdAt desc"', 'InvalidSort')
      }

      const normalizedDirection = direction.toLowerCase()
      if (normalizedDirection !== 'asc' && normalizedDirection !== 'desc') {
        throw BusinessError.BadRequest('Invalid sort direction. Use "asc" or "desc"', 'InvalidSortDirection')
      }

      switch (field) {
        case 'username':
          orderBy = { username: normalizedDirection }
          break
        case 'email':
          orderBy = { email: normalizedDirection }
          break
        case 'displayName':
          orderBy = { displayName: normalizedDirection }
          break
        case 'status':
          orderBy = { status: normalizedDirection }
          break
        case 'createdAt':
          orderBy = { createdAt: normalizedDirection }
          break
        case 'updatedAt':
          orderBy = { updatedAt: normalizedDirection }
          break
        default:
          throw BusinessError.BadRequest('Invalid sort field. Allowed fields: username, email, displayName, status, createdAt, updatedAt', 'InvalidSortField')
      }
    }

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
