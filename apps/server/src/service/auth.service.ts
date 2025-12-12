import type { AuthLoginRequest, AuthLoginResponse } from '@server/src/schemas/auth.schema'
import { randomUUID } from 'node:crypto'
import { envConfig } from '@server/src/common/config'
import { BadRequestError } from '@server/src/common/exception'
import { generateAccessToken, storeAcessToken } from '@server/src/lib/jwt'
import { prisma } from '@server/src/lib/prisma'
import { getContext } from '@server/src/middleware/context-holder'
import { parseTimeDuration } from '@server/src/utils/date'
import bcrypt from 'bcryptjs'

class AuthService {
  async login(request: AuthLoginRequest): Promise<AuthLoginResponse> {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: request.username },
    })
    if (!user) {
      throw BadRequestError.UserOrPasswordIncorrect()
    }

    // Verify password
    const hashedInputPassword = await bcrypt.hash(request.password, user.salt)
    if (hashedInputPassword !== user.password) {
      throw BadRequestError.UserOrPasswordIncorrect()
    }

    // Generate access token
    const accessToken = await generateAccessToken(user.id)
    // Store access token in cookie
    storeAcessToken(getContext()!, accessToken)

    // Generate refresh token
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        expiresAt: parseTimeDuration(envConfig.auth.refreshTokenExpiry),
      },
    })

    return { refreshToken: refreshToken.token }
  }
}

const authService = new AuthService()
export { authService }
