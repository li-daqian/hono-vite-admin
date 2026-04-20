import type {
  RoleCreateRequest,
  RoleCreateResponse,
  RoleDeleteResponse,
  RoleListResponse,
  RolePermissionsResponse,
  RolePermissionsUpdateRequest,
  RoleProfileResponse,
  RoleUpdateRequest,
} from '@server/src/modules/role/role.schema'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { auditService } from '@server/src/modules/audit/audit.service'
import { buildRolePermissionsTree, flattenEnabledRolePermissions } from '@server/src/modules/role/role-permission-tree'

class RoleService {
  async createRole(request: RoleCreateRequest): Promise<RoleCreateResponse> {
    if (!(await this.isRoleNameUnique(request.name))) {
      throw BusinessError.BadRequest('Role name already exists', 'RoleNameAlreadyExists')
    }

    const role = await prisma.$transaction(async (tx) => {
      const createdRole = await tx.role.create({
        data: {
          name: request.name,
          description: request.description,
        },
      })

      await auditService.record(tx, {
        module: 'role',
        action: 'create',
        requestSnapshot: request,
      })

      return createdRole
    })

    return role
  }

  async getRoleById(roleId: string): Promise<RoleProfileResponse> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    return role
  }

  async getRoleList(): Promise<RoleListResponse> {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
    })
  }

  async updateRole(roleId: string, request: RoleUpdateRequest): Promise<RoleProfileResponse> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    if (request.name && request.name !== role.name && !(await this.isRoleNameUnique(request.name))) {
      throw BusinessError.BadRequest('Role name already exists', 'RoleNameAlreadyExists')
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      const nextRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: request.name,
          description: request.description,
        },
      })

      await auditService.record(tx, {
        module: 'role',
        action: 'update',
        requestSnapshot: {
          id: roleId,
          ...request,
        },
      })

      return nextRole
    })

    return updatedRole
  }

  async deleteRole(roleId: string): Promise<RoleDeleteResponse> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.role.delete({
        where: { id: roleId },
      })

      await auditService.record(tx, {
        module: 'role',
        action: 'delete',
        requestSnapshot: { id: roleId },
      })
    })

    return {
      deletedCount: 1,
    }
  }

  async getRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    const [rolePermissions, menus, actions] = await Promise.all([
      prisma.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
      }),
      prisma.menu.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.action.findMany(),
    ])

    return buildRolePermissionsTree(
      menus,
      actions,
      rolePermissions.map(({ permission }) => ({
        type: permission.type,
        targetId: permission.targetId,
      })),
    )
  }

  async updateRolePermissions(roleId: string, request: RolePermissionsUpdateRequest): Promise<RolePermissionsResponse> {
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    const permissionEntries = flattenEnabledRolePermissions(request)

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } })

      if (permissionEntries.length > 0) {
        for (const entry of permissionEntries) {
          await tx.permission.upsert({
            where: { type_targetId: { type: entry.type, targetId: entry.targetId } },
            create: { type: entry.type, targetId: entry.targetId },
            update: {},
          })
        }

        const permissions = await tx.permission.findMany({
          where: {
            OR: permissionEntries.map(e => ({ type: e.type, targetId: e.targetId })),
          },
        })

        await tx.rolePermission.createMany({
          data: permissions.map(p => ({ roleId, permissionId: p.id })),
        })
      }

      await auditService.record(tx, {
        module: 'role',
        action: 'permissions-update',
        requestSnapshot: {
          id: roleId,
          permissions: request,
        },
      })
    })

    return request
  }

  private async isRoleNameUnique(name: string): Promise<boolean> {
    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    return existingRole === null
  }
}

export const roleService = new RoleService()
