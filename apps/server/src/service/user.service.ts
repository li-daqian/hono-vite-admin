import type { UserCreateRequest, UserCreateResponse } from '@server/src/routes/user/schema'
import { BadRequestError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import bcrypt from 'bcryptjs'

class UserService {
  async createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    if (!(await this.isUsernameUnique(request.username))) {
      throw BadRequestError.UsernameAlreadyExists()
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

  async isUsernameUnique(username: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })
    return existingUser === null
  }
}

const userService = new UserService()
export { userService }
