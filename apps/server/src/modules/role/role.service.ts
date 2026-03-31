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
import { PermissionType } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'

class RoleService {
  async createRole(request: RoleCreateRequest): Promise<RoleCreateResponse> {
    if (!(await this.isRoleNameUnique(request.name))) {
      throw BusinessError.BadRequest('Role name already exists', 'RoleNameAlreadyExists')
    }

    const role = await prisma.role.create({
      data: {
        name: request.name,
        description: request.description,
      },
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

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: request.name,
        description: request.description,
      },
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

    await prisma.role.delete({
      where: { id: roleId },
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

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })

    const menuIds = rolePermissions
      .filter(rp => rp.permission.type === PermissionType.MENU)
      .map(rp => rp.permission.targetId)
    const actionIds = rolePermissions
      .filter(rp => rp.permission.type === PermissionType.ACTION)
      .map(rp => rp.permission.targetId)

    return { menuIds, actionIds }
  }

  async updateRolePermissions(roleId: string, request: RolePermissionsUpdateRequest): Promise<RolePermissionsResponse> {
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw BusinessError.NotFound('Role not found')
    }

    const permissionEntries = [
      ...request.menuIds.map(id => ({ type: PermissionType.MENU, targetId: id })),
      ...request.actionIds.map(id => ({ type: PermissionType.ACTION, targetId: id })),
    ]

    await prisma.$transaction(async (tx) => {
      // Upsert all needed permissions
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

      // Replace all role permissions
      await tx.rolePermission.deleteMany({ where: { roleId } })
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map(p => ({ roleId, permissionId: p.id })),
        })
      }
    })

    return { menuIds: request.menuIds, actionIds: request.actionIds }
  }

  private async isRoleNameUnique(name: string): Promise<boolean> {
    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    return existingRole === null
  }
}

export const roleService = new RoleService()
