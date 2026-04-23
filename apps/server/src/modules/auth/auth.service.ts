import type { Action, Menu } from '@server/generated/prisma/client'
import type {
  AuthChangePasswordRequest,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthMenu,
  AuthMenuResponse,
  AuthPrefillResponse,
  AuthRefreshResponse,
} from '@server/src/modules/auth/auth.schema'
import { randomUUID } from 'node:crypto'
import { PermissionType, UserStatus } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { jwtService } from '@server/src/lib/jwt'
import { createPasswordHash, verifyPassword } from '@server/src/lib/password'
import { prisma } from '@server/src/lib/prisma'
import { logger } from '@server/src/middleware/trace.middleware'
import { auditService } from '@server/src/modules/audit/audit.service'
import { parseTimeDuration } from '@server/src/utils/date'

class AuthService {
  async getPrefilledCredentials(): Promise<AuthPrefillResponse> {
    return {
      username: getEnv().admin.username,
      password: getEnv().admin.password,
    }
  }

  async login(request: AuthLoginRequest): Promise<AuthLoginResponse> {
    const user = await prisma.user.findUnique({
      where: { username: request.username },
    })
    if (!user) {
      await this.recordLoginFailure({
        operatorId: null,
        operatorUsername: request.username,
        operatorDisplayName: null,
        reason: 'user-not-found',
        username: request.username,
      })
      throw BusinessError.UserOrPasswordIncorrect()
    }
    if (user.status !== UserStatus.ACTIVE) {
      await this.recordLoginFailure({
        operatorId: user.id,
        operatorUsername: user.username,
        operatorDisplayName: user.displayName,
        reason: 'user-account-disabled',
        username: user.username,
      })
      throw BusinessError.BadRequest('User account is disabled', 'UserAccountDisabled')
    }

    const isPasswordValid = await verifyPassword(request.password, user.password, user.salt)
    if (!isPasswordValid) {
      await this.recordLoginFailure({
        operatorId: user.id,
        operatorUsername: user.username,
        operatorDisplayName: user.displayName,
        reason: 'password-incorrect',
        username: user.username,
      })
      throw BusinessError.UserOrPasswordIncorrect()
    }

    const accessToken = await jwtService.generateAccessToken(user.id)
    const refreshTokenExpiry = getEnv().auth.refreshTokenExpiry
    const refreshToken = await prisma.$transaction(async (tx) => {
      const createdRefreshToken = await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: randomUUID(),
          expiresAt: parseTimeDuration(refreshTokenExpiry),
        },
      })

      await auditService.record(tx, {
        category: 'login',
        module: 'auth',
        action: 'login-success',
        operator: {
          operatorId: user.id,
          operatorUsername: user.username,
          operatorDisplayName: user.displayName,
        },
        requestSnapshot: {
          username: user.username,
          result: 'success',
        },
      })

      return createdRefreshToken
    })

    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
    }
  }

  async refresh(refreshToken: string | undefined, slideMode: boolean): Promise<AuthRefreshResponse> {
    if (!refreshToken) {
      throw BusinessError.Unauthorized('Missing refresh token')
    }

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })
    if (!existingToken) {
      throw BusinessError.Unauthorized('Invalid refresh token')
    }

    if (existingToken.expiresAt <= new Date()) {
      await prisma.refreshToken.delete({ where: { token: existingToken.token } })
      throw BusinessError.Unauthorized('Refresh token expired')
    }

    const newRefreshToken = existingToken
    newRefreshToken.token = randomUUID()

    if (slideMode) {
      const refreshTokenExpiry = getEnv().auth.refreshTokenExpiry
      newRefreshToken.expiresAt = parseTimeDuration(refreshTokenExpiry)
    }

    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: {
        token: newRefreshToken.token,
        expiresAt: newRefreshToken.expiresAt,
      },
    })

    const accessToken = await jwtService.generateAccessToken(existingToken.userId)

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      refreshTokenExpiresAt: newRefreshToken.expiresAt.toISOString(),
    }
  }

  async changePassword(userId: string, request: AuthChangePasswordRequest): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw BusinessError.NotFound('User not found')
    }

    const isCurrentPasswordValid = await verifyPassword(request.currentPassword, user.password, user.salt)
    if (!isCurrentPasswordValid) {
      await this.recordPasswordChangeFailure(userId, 'current-password-incorrect')
      throw BusinessError.BadRequest('Current password is incorrect', 'CurrentPasswordIncorrect')
    }

    const { hashedPassword, salt } = await createPasswordHash(request.newPassword)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          salt,
        },
      })

      await auditService.record(tx, {
        module: 'auth',
        action: 'change-password',
        requestSnapshot: {
          userId,
          result: 'success',
        },
      })
    })
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      let refreshTokenRevoked = false

      if (refreshToken) {
        const existingToken = await tx.refreshToken.findUnique({
          where: { token: refreshToken },
        })

        if (!existingToken) {
          logger().warn(`Refresh token not found during logout: ${refreshToken}`)
        }
        else if (existingToken.userId === userId) {
          await tx.refreshToken.delete({ where: { token: refreshToken } })
          refreshTokenRevoked = true
        }
        else {
          logger().warn(
            `Refresh token does not belong to the current user. `
            + `refreshToken=${refreshToken}, `
            + `currentUserId=${userId}, `
            + `tokenUserId=${existingToken.userId}`,
          )
        }
      }

      await auditService.record(tx, {
        category: 'login',
        module: 'auth',
        action: 'logout',
        requestSnapshot: {
          userId,
          result: 'success',
          refreshTokenRevoked,
        },
      })
    })
  }

  async getUserMenus(userId: string): Promise<AuthMenuResponse> {
    const roles = await prisma.userRole.findMany({
      where: { userId },
    })
    if (roles.length === 0) {
      return []
    }

    const roleIds = roles.map(role => role.roleId)
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
    })
    if (rolePermissions.length === 0) {
      return []
    }

    const permissionIds = rolePermissions.map(rp => rp.permissionId)
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    })

    const menuIds = permissions
      .filter(p => p.type === PermissionType.MENU)
      .map(p => p.targetId)
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
    })
    const actionIds = permissions
      .filter(p => p.type === PermissionType.ACTION)
      .map(p => p.targetId)
    const actions = await prisma.action.findMany({
      where: { id: { in: actionIds } },
    })

    return this.buildMenuTree(menus, actions)
  }

  private buildMenuTree(menus: Menu[], actions: Action[]): AuthMenuResponse {
    const menusByParentId = menus.reduce<Record<string, Menu[]>>((acc, menu) => {
      (acc[menu.parentId ?? ''] ??= []).push(menu)
      return acc
    }, {})
    const actionsByMenuId = actions.reduce<Record<string, Action[]>>((acc, action) => {
      (acc[action.menuId] ??= []).push(action)
      return acc
    }, {})

    const buildMenuNode = (currentLevelMenus: Menu[]): AuthMenu[] => {
      currentLevelMenus.sort((a, b) => a.order - b.order)
      return currentLevelMenus.map((m) => {
        const menuActions = (actionsByMenuId[m.id] ?? []).map(a => ({
          id: a.id,
          name: a.name,
        }))

        const childMenus = menusByParentId[m.id] ?? []
        return {
          id: m.id,
          name: m.name,
          path: m.path,
          actions: menuActions,
          children: buildMenuNode(childMenus),
        }
      })
    }

    return buildMenuNode(menusByParentId[''] || [])
  }

  private async recordLoginFailure(input: {
    operatorId: string | null
    operatorUsername: string
    operatorDisplayName: string | null | undefined
    reason: string
    username: string
  }) {
    await auditService.record(prisma, {
      category: 'login',
      module: 'auth',
      action: 'login-failed',
      operator: {
        operatorId: input.operatorId,
        operatorUsername: input.operatorUsername,
        operatorDisplayName: input.operatorDisplayName ?? null,
      },
      requestSnapshot: {
        username: input.username,
        result: 'failure',
        reason: input.reason,
      },
    })
  }

  private async recordPasswordChangeFailure(userId: string, reason: string) {
    await auditService.record(prisma, {
      module: 'auth',
      action: 'change-password-failed',
      requestSnapshot: {
        userId,
        result: 'failure',
        reason,
      },
    })
  }
}

export const authService = new AuthService()
