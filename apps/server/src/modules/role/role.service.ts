import type {
  RoleCreateRequest,
  RoleCreateResponse,
  RoleDeleteResponse,
  RoleListResponse,
  RoleProfileResponse,
  RoleUpdateRequest,
} from '@server/src/modules/role/role.schema'
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

  private async isRoleNameUnique(name: string): Promise<boolean> {
    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    return existingRole === null
  }
}

export const roleService = new RoleService()
