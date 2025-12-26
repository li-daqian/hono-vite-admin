import type { AuthLoginRequest, AuthLoginResponse, AuthLogoutRequest, AuthRefreshRequest, AuthRefreshResponse } from '@server/src/schemas/auth.schema'
import { randomUUID } from 'node:crypto'
import { BadRequestError, UnauthorizedError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { clearAccessToken, generateAccessToken, getAuthContext, storeAcessToken } from '@server/src/lib/jwt'
import { prisma } from '@server/src/lib/prisma'
import { getLoginUser } from '@server/src/middleware/auth'
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
        expiresAt: parseTimeDuration(getEnv().auth.refreshTokenExpiry),
      },
    })

    return { refreshToken: refreshToken.token }
  }

  async refresh(request: AuthRefreshRequest): Promise<AuthRefreshResponse> {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: request.refreshToken },
    })

    if (!existingToken) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    if (existingToken.expiresAt <= new Date()) {
      await prisma.refreshToken.delete({ where: { token: existingToken.token } })
      throw new UnauthorizedError('Refresh token expired')
    }

    const accessToken = await generateAccessToken(existingToken.userId)
    storeAcessToken(getContext()!, accessToken)

    const newRefreshToken = await prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: existingToken.userId,
          token: randomUUID(),
          expiresAt: parseTimeDuration(getEnv().auth.refreshTokenExpiry),
        },
      })

      await tx.refreshToken.delete({ where: { token: existingToken.token } })
      return created
    })

    return { refreshToken: newRefreshToken.token }
  }

  async logout(request: AuthLogoutRequest): Promise<void> {
    const existingToken = await prisma.refreshToken.findUnique({ where: { token: request.refreshToken } })
    if (existingToken?.userId !== getLoginUser()!.userId) {
      throw BadRequestError.Message('Refresh token does not belong to the logged-in user')
    }
    // Remove refresh token if exists
    await prisma.refreshToken.delete({ where: { token: request.refreshToken } })

    // Clear access token cookie
    clearAccessToken(getContext()!)
  }
}

const authService = new AuthService()
export { authService }
