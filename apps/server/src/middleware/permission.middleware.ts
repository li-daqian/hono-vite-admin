import type { MiddlewareHandler } from 'hono'
import { PermissionType } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { getLoginUser } from '@server/src/middleware/auth.middleware'

export interface ActionPermissionChecker {
  hasUserActionPermission: (userId: string, actionId: string) => Promise<boolean>
}

export const actionPermissionChecker: ActionPermissionChecker = {
  async hasUserActionPermission(userId, actionId) {
    const matchedPermissions = await prisma.rolePermission.count({
      where: {
        role: {
          userRoles: {
            some: {
              userId,
            },
          },
        },
        permission: {
          type: PermissionType.ACTION,
          targetId: actionId,
        },
      },
    })

    return matchedPermissions > 0
  },
}

export function requireActionPermission(
  actionId: string,
  checker: ActionPermissionChecker = actionPermissionChecker,
): MiddlewareHandler {
  return async (c, next) => {
    const { userId } = getLoginUser(c)
    const hasPermission = await checker.hasUserActionPermission(userId, actionId)

    if (!hasPermission) {
      throw BusinessError.Forbidden('You do not have permission to perform this action.', 'PermissionDenied')
    }

    await next()
  }
}
