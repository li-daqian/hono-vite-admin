import type { AuthLoginRequest, AuthLoginResponse, AuthRefreshRequest, AuthRefreshResponse } from '@server/src/routes/auth/schema'
import { randomUUID } from 'node:crypto'
import { UserStatus } from '@server/generated/prisma/enums'
import { BadRequestError, UnauthorizedError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { generateAccessToken, refreshTokenCookie } from '@server/src/lib/jwt'
import { prisma } from '@server/src/lib/prisma'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { logger } from '@server/src/middleware/trace.middleware'
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
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestError('USER_DISABLED', 'User account is disabled')
    }

    // Verify password
    const hashedInputPassword = await bcrypt.hash(request.password, user.salt)
    if (hashedInputPassword !== user.password) {
      throw BadRequestError.UserOrPasswordIncorrect()
    }

    // Generate access token
    const accessToken = await generateAccessToken(user.id)

    // Generate refresh token
    const refreshTokenExpiry = getEnv().auth.refreshTokenExpiry
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        expiresAt: parseTimeDuration(refreshTokenExpiry),
      },
    })

    refreshTokenCookie.set(refreshToken)

    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
    }
  }

  async refresh(request: AuthRefreshRequest): Promise<AuthRefreshResponse> {
    const refreshToken = request.refreshToken ?? refreshTokenCookie.get()
    if (!refreshToken) {
      throw new UnauthorizedError('Missing refresh token')
    }

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })
    if (!existingToken) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    if (existingToken.expiresAt <= new Date()) {
      await prisma.refreshToken.delete({ where: { token: existingToken.token } })
      throw new UnauthorizedError('Refresh token expired')
    }

    const newRefreshToken = existingToken
    newRefreshToken.token = randomUUID()

    const slideMode = !!request.refreshToken
    if (slideMode) {
      // In slide mode, extend the expiry of the existing token
      const refreshTokenExpiry = getEnv().auth.refreshTokenExpiry
      const newExpiry = parseTimeDuration(refreshTokenExpiry)
      newRefreshToken.expiresAt = newExpiry
    }

    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: {
        token: newRefreshToken.token,
        expiresAt: newRefreshToken.expiresAt,
      },
    })

    const accessToken = await generateAccessToken(existingToken.userId)

    refreshTokenCookie.set(newRefreshToken)

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      refreshTokenExpiresAt: newRefreshToken.expiresAt.toISOString(),
    }
  }

  async logout(): Promise<void> {
    const refreshToken = refreshTokenCookie.get()

    if (refreshToken) {
      const existingToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      })

      if (!existingToken) {
        logger().warn(`Refresh token not found during logout: ${refreshToken}`)
      }

      const currentUserId = getLoginUser()!.userId
      if (existingToken && existingToken.userId === currentUserId) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } })
      }
      else {
        logger().warn(
          `Refresh token does not belong to the current user. `
          + `refreshToken=${refreshToken}, `
          + `currentUserId=${currentUserId}, `
          + `tokenUserId=${existingToken?.userId}`,
        )
      }
    }

    // Clear refresh token cookie, the access token is stateless and cannot be cleared server-side
    refreshTokenCookie.clear()
  }
}

const authService = new AuthService()
export { authService }
