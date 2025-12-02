import type { UserCreateRequest, UserCreateResponse } from '@server/src/schemas/user.schema'
import { prisma } from '@server/src/lib/prisma'
import bcrypt from 'bcryptjs'

class UserService {
  async createUser(data: UserCreateRequest): Promise<UserCreateResponse> {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(data.password, salt)

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        salt,
        email: data.email,
        phone: data.phone,
        displayName: data.displayName,
      },
    })

    // Remove sensitive info before returning
    const { password, salt: userSalt, ...safeUser } = user
    return {
      ...safeUser,
    }
  }
}

const userService = new UserService()
export { userService }
