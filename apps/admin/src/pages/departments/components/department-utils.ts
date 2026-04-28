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

export function mapDepartmentTreeItem(
  department: DepartmentTreeItemSchema,
): DepartmentProfileResponseSchema {
  return {
    id: department.id,
    parentId: department.parentId,
    name: department.name,
    leader: department.leader,
    phone: department.phone,
    email: department.email,
    order: department.order,
    status: department.status,
    userCount: department.userCount,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  }
}

export function flattenDepartmentTree(
  departments: DepartmentTreeItemSchema[],
  depth = 0,
): DepartmentTableRow[] {
  return departments.flatMap((department) => {
    const row: DepartmentTableRow = {
      ...mapDepartmentTreeItem(department),
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

export function filterDepartmentTree(
  departments: DepartmentTreeItemSchema[],
  predicate: (department: DepartmentTreeItemSchema) => boolean,
): DepartmentTreeItemSchema[] {
  return departments.flatMap((department) => {
    const children = filterDepartmentTree(department.children, predicate)

    if (!predicate(department) && children.length === 0) {
      return []
    }

    return [{
      ...department,
      children,
    }]
  })
}

export function omitDepartmentTree(
  departments: DepartmentTreeItemSchema[],
  excludeIds: Set<string>,
): DepartmentTreeItemSchema[] {
  return departments.flatMap((department) => {
    if (excludeIds.has(department.id)) {
      return []
    }

    return [{
      ...department,
      children: omitDepartmentTree(department.children, excludeIds),
    }]
  })
}

export function findDepartmentById(
  departments: DepartmentTreeItemSchema[],
  departmentId: string,
): DepartmentTreeItemSchema | null {
  for (const department of departments) {
    if (department.id === departmentId) {
      return department
    }

    const childDepartment = findDepartmentById(department.children, departmentId)
    if (childDepartment) {
      return childDepartment
    }
  }

  return null
}

export function countDepartmentTree(departments: DepartmentTreeItemSchema[]): number {
  return departments.reduce((count, department) => count + 1 + countDepartmentTree(department.children), 0)
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
        label: department.name,
        depth,
      },
      ...children,
    ]
  })
}
