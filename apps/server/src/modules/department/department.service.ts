import type { Department } from '@server/generated/prisma/client'
import type {
  DepartmentAssignUsersRequest,
  DepartmentAssignUsersResponse,
  DepartmentCreateRequest,
  DepartmentDeleteResponse,
  DepartmentListRequest,
  DepartmentProfileResponse,
  DepartmentReorderRequest,
  DepartmentReorderResponse,
  DepartmentTreeItem,
  DepartmentTreeResponse,
  DepartmentUpdateRequest,
  DepartmentUserResponse,
  DepartmentUsersResponse,
} from '@server/src/modules/department/department.schema'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { auditService } from '@server/src/modules/audit/audit.service'

type DepartmentWithUserCount = Department & {
  _count: {
    users: number
  }
}

class DepartmentService {
  async createDepartment(request: DepartmentCreateRequest): Promise<DepartmentProfileResponse> {
    await this.assertValidParent(request.parentId ?? null)

    const department = await prisma.$transaction(async (tx) => {
      const createdDepartment = await tx.department.create({
        data: {
          parentId: request.parentId ?? null,
          name: request.name,
          leader: request.leader ?? null,
          phone: request.phone ?? null,
          email: request.email ?? null,
          order: request.order,
          status: request.status,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      })

      await auditService.record(tx, {
        module: 'department',
        action: 'create',
        requestSnapshot: request,
      })

      return createdDepartment
    })

    return this.mapDepartment(department)
  }

  async getDepartmentTree(query: DepartmentListRequest): Promise<DepartmentTreeResponse> {
    const departments = await prisma.department.findMany({
      where: {
        ...(query.status && { status: { in: query.status } }),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    })

    return this.buildDepartmentTree(departments)
  }

  async getDepartmentById(departmentId: string): Promise<DepartmentProfileResponse> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!department) {
      throw BusinessError.NotFound('Department not found')
    }

    return this.mapDepartment(department)
  }

  async updateDepartment(departmentId: string, request: DepartmentUpdateRequest): Promise<DepartmentProfileResponse> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!department) {
      throw BusinessError.NotFound('Department not found')
    }

    if (request.parentId !== undefined) {
      await this.assertValidParent(request.parentId, departmentId)
    }

    const updatedDepartment = await prisma.$transaction(async (tx) => {
      const nextDepartment = await tx.department.update({
        where: { id: departmentId },
        data: {
          parentId: request.parentId,
          name: request.name,
          leader: request.leader,
          phone: request.phone,
          email: request.email,
          order: request.order,
          status: request.status,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      })

      await auditService.record(tx, {
        module: 'department',
        action: 'update',
        requestSnapshot: {
          id: departmentId,
          ...request,
        },
      })

      return nextDepartment
    })

    return this.mapDepartment(updatedDepartment)
  }

  async reorderDepartments(request: DepartmentReorderRequest): Promise<DepartmentReorderResponse> {
    const departmentIds = request.items.map(item => item.id)
    const uniqueDepartmentIds = new Set(departmentIds)

    if (uniqueDepartmentIds.size !== departmentIds.length) {
      throw BusinessError.BadRequest('Duplicate department IDs are not allowed', 'DuplicateDepartmentIds')
    }

    const existingDepartments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    })

    if (existingDepartments.length !== departmentIds.length) {
      throw BusinessError.BadRequest('One or more departments were not found', 'DepartmentNotFound')
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(request.items.map(item => tx.department.update({
        where: { id: item.id },
        data: { order: item.order },
      })))

      await auditService.record(tx, {
        module: 'department',
        action: 'reorder',
        requestSnapshot: request,
      })
    })

    return { updatedCount: request.items.length }
  }

  async getDepartmentUsers(departmentId: string): Promise<DepartmentUsersResponse> {
    await this.assertDepartmentExists(departmentId)

    const users = await prisma.user.findMany({
      where: {
        departments: {
          some: { departmentId },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        status: true,
      },
      orderBy: [
        { username: 'asc' },
      ],
    })

    return users.map(user => this.mapDepartmentUser(user))
  }

  async assignDepartmentUsers(
    departmentId: string,
    request: DepartmentAssignUsersRequest,
  ): Promise<DepartmentAssignUsersResponse> {
    await this.assertDepartmentExists(departmentId)

    const userIds = this.getUniqueIds(request.userIds)
    await this.ensureUsersExist(userIds)

    const users = await prisma.$transaction(async (tx) => {
      await tx.userDepartment.deleteMany({
        where: { departmentId },
      })

      if (userIds.length > 0) {
        await tx.userDepartment.createMany({
          data: userIds.map(userId => ({
            departmentId,
            userId,
          })),
          skipDuplicates: true,
        })
      }

      await auditService.record(tx, {
        module: 'department',
        action: 'assign-users',
        requestSnapshot: {
          id: departmentId,
          userIds,
        },
      })

      return tx.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          status: true,
        },
        orderBy: [
          { username: 'asc' },
        ],
      })
    })

    return {
      updatedCount: userIds.length,
      users: users.map(user => this.mapDepartmentUser(user)),
    }
  }

  async deleteDepartment(departmentId: string): Promise<DepartmentDeleteResponse> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!department) {
      throw BusinessError.NotFound('Department not found')
    }

    const childCount = await prisma.department.count({
      where: { parentId: departmentId },
    })
    if (childCount > 0) {
      throw BusinessError.BadRequest('Cannot delete a department that has child departments', 'DepartmentHasChildren')
    }

    if (department._count.users > 0) {
      throw BusinessError.BadRequest('Cannot delete a department that has assigned users', 'DepartmentHasUsers')
    }

    await prisma.$transaction(async (tx) => {
      await tx.department.delete({
        where: { id: departmentId },
      })

      await auditService.record(tx, {
        module: 'department',
        action: 'delete',
        requestSnapshot: { id: departmentId },
      })
    })

    return { deletedCount: 1 }
  }

  private buildDepartmentTree(departments: DepartmentWithUserCount[]): DepartmentTreeResponse {
    const nodes = departments.map(department => ({
      ...this.mapDepartment(department),
      children: [],
    } satisfies DepartmentTreeItem))
    const ids = new Set(nodes.map(node => node.id))
    const nodesByParentId = nodes.reduce<Record<string, DepartmentTreeItem[]>>((acc, node) => {
      const parentKey = node.parentId && ids.has(node.parentId) ? node.parentId : ''
      ;(acc[parentKey] ??= []).push(node)
      return acc
    }, {})

    const buildNode = (parentId: string): DepartmentTreeItem[] => {
      return (nodesByParentId[parentId] ?? []).map(node => ({
        ...node,
        children: buildNode(node.id),
      }))
    }

    return buildNode('')
  }

  private mapDepartment(department: DepartmentWithUserCount): DepartmentProfileResponse {
    return {
      id: department.id,
      parentId: department.parentId,
      name: department.name,
      leader: department.leader,
      phone: department.phone,
      email: department.email,
      order: department.order,
      status: department.status,
      userCount: department._count.users,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    }
  }

  private mapDepartmentUser(user: DepartmentUserResponse): DepartmentUserResponse {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      status: user.status,
    }
  }

  private getUniqueIds(ids: string[] | undefined): string[] {
    return [...new Set(ids ?? [])]
  }

  private async assertDepartmentExists(departmentId: string): Promise<void> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    })

    if (!department) {
      throw BusinessError.NotFound('Department not found')
    }
  }

  private async ensureUsersExist(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })

    if (users.length !== userIds.length) {
      throw BusinessError.BadRequest('One or more users were not found', 'UserNotFound')
    }
  }

  private async assertValidParent(parentId: string | null | undefined, currentDepartmentId?: string): Promise<void> {
    if (!parentId) {
      return
    }

    if (parentId === currentDepartmentId) {
      throw BusinessError.BadRequest('Department cannot be its own parent', 'InvalidDepartmentParent')
    }

    const parent = await prisma.department.findUnique({
      where: { id: parentId },
      select: { id: true },
    })

    if (!parent) {
      throw BusinessError.BadRequest('Parent department not found', 'ParentDepartmentNotFound')
    }

    if (currentDepartmentId && await this.isDescendant(parentId, currentDepartmentId)) {
      throw BusinessError.BadRequest('Department cannot be moved under its own descendant', 'InvalidDepartmentParent')
    }
  }

  private async isDescendant(candidateParentId: string, departmentId: string): Promise<boolean> {
    let nextParentId: string | null = candidateParentId
    const visited = new Set<string>()

    while (nextParentId) {
      if (nextParentId === departmentId) {
        return true
      }

      if (visited.has(nextParentId)) {
        return false
      }

      visited.add(nextParentId)
      const parent: { parentId: string | null } | null = await prisma.department.findUnique({
        where: { id: nextParentId },
        select: { parentId: true },
      })
      nextParentId = parent?.parentId ?? null
    }

    return false
  }
}

export const departmentService = new DepartmentService()
