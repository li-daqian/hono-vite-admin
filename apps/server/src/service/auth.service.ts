import type { Action, Menu } from '@server/generated/prisma/client'
import type { AuthLoginRequest, AuthLoginResponse, AuthMenu, AuthMenuResponse, AuthPrefillResponse, AuthRefreshResponse } from '@server/src/schemas/auth.schema'
import { randomUUID } from 'node:crypto'
import { PermissionType, UserStatus } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { jwtService } from '@server/src/lib/jwt'
import { prisma } from '@server/src/lib/prisma'
import { logger } from '@server/src/middleware/trace.middleware'
import { parseTimeDuration } from '@server/src/utils/date'
import bcrypt from 'bcryptjs'

class AuthService {
  async getPrefilledCredentials(): Promise<AuthPrefillResponse> {
    return {
      username: getEnv().admin.username,
      password: getEnv().admin.password,
    }
  }

  async login(request: AuthLoginRequest): Promise<AuthLoginResponse> {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: request.username },
    })
    if (!user) {
      throw BusinessError.UserOrPasswordIncorrect()
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw BusinessError.BadRequest('User account is disabled', 'UserAccountDisabled')
    }

    // Verify password
    const hashedInputPassword = await bcrypt.hash(request.password, user.salt)
    if (hashedInputPassword !== user.password) {
      throw BusinessError.UserOrPasswordIncorrect()
    }

    // Generate access token
    const accessToken = await jwtService.generateAccessToken(user.id)

    // Generate refresh token
    const refreshTokenExpiry = getEnv().auth.refreshTokenExpiry
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        expiresAt: parseTimeDuration(refreshTokenExpiry),
      },
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

    const accessToken = await jwtService.generateAccessToken(existingToken.userId)

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      refreshTokenExpiresAt: newRefreshToken.expiresAt.toISOString(),
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!existingToken) {
      logger().warn(`Refresh token not found during logout: ${refreshToken}`)
    }

    if (existingToken && existingToken.userId === userId) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } })
    }
    else {
      logger().warn(
        `Refresh token does not belong to the current user. `
        + `refreshToken=${refreshToken}, `
        + `currentUserId=${userId}, `
        + `tokenUserId=${existingToken?.userId}`,
      )
    }
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
          actions: menuActions,
          children: buildMenuNode(childMenus),
        }
      })
    }

    return buildMenuNode(menusByParentId[''] || [])
  }
}

export const authService = new AuthService()
