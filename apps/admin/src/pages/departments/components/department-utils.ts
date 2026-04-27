import type { DepartmentProfileResponseSchema, DepartmentTreeItemSchema } from '@admin/client'

export interface DepartmentTableRow extends DepartmentProfileResponseSchema {
  depth: number
  hasChildren: boolean
}

export interface DepartmentOption {
  value: string
  label: string
  depth: number
}

export function flattenDepartmentTree(
  departments: DepartmentTreeItemSchema[],
  depth = 0,
): DepartmentTableRow[] {
  return departments.flatMap((department) => {
    const row: DepartmentTableRow = {
      id: department.id,
      parentId: department.parentId,
      name: department.name,
      code: department.code,
      leader: department.leader,
      phone: department.phone,
      email: department.email,
      order: department.order,
      status: department.status,
      userCount: department.userCount,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      depth,
      hasChildren: department.children.length > 0,
    }

    return [
      row,
      ...flattenDepartmentTree(department.children, depth + 1),
    ]
  })
}

export function collectDepartmentAndDescendantIds(
  departments: DepartmentTreeItemSchema[],
  departmentId: string,
): Set<string> {
  const ids = new Set<string>()

  function visit(nodes: DepartmentTreeItemSchema[], inTargetBranch: boolean) {
    for (const node of nodes) {
      const nextInTargetBranch = inTargetBranch || node.id === departmentId
      if (nextInTargetBranch) {
        ids.add(node.id)
      }
      visit(node.children, nextInTargetBranch)
    }
  }

  visit(departments, false)
  return ids
}

export function flattenDepartmentOptions(
  departments: DepartmentTreeItemSchema[],
  excludeIds = new Set<string>(),
  depth = 0,
): DepartmentOption[] {
  return departments.flatMap((department) => {
    const children = flattenDepartmentOptions(department.children, excludeIds, depth + 1)

    if (excludeIds.has(department.id)) {
      return children
    }

    return [
      {
        value: department.id,
        label: `${'-- '.repeat(depth)}${department.name}`,
        depth,
      },
      ...children,
    ]
  })
}
