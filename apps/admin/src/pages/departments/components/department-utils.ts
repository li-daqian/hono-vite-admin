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

export interface DepartmentSiblingContext {
  department: DepartmentTreeItemSchema
  siblings: DepartmentTreeItemSchema[]
  index: number
  parentId: string | null
}

export interface DepartmentTreeIndexes {
  nodeById: Map<string, DepartmentTreeItemSchema>
  siblingContextById: Map<string, DepartmentSiblingContext>
}

export interface DepartmentSiblingReorderResult {
  parentId: string | null
  previousSiblings: DepartmentTreeItemSchema[]
  nextSiblings: DepartmentTreeItemSchema[]
}

export type DepartmentDropPosition = 'before' | 'after'

export function mapDepartmentTreeItem(
  department: DepartmentTreeItemSchema,
): DepartmentProfileResponseSchema {
  return {
    id: department.id,
    parentId: department.parentId,
    name: department.name,
    leaders: department.leaders,
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

export function buildDepartmentTreeIndexes(
  departments: DepartmentTreeItemSchema[],
  parentId: string | null = null,
): DepartmentTreeIndexes {
  const nodeById = new Map<string, DepartmentTreeItemSchema>()
  const siblingContextById = new Map<string, DepartmentSiblingContext>()

  function visit(nodes: DepartmentTreeItemSchema[], currentParentId: string | null) {
    nodes.forEach((node, index) => {
      nodeById.set(node.id, node)
      siblingContextById.set(node.id, {
        department: node,
        siblings: nodes,
        index,
        parentId: currentParentId,
      })
      visit(node.children, node.id)
    })
  }

  visit(departments, parentId)

  return {
    nodeById,
    siblingContextById,
  }
}

export function getDepartmentSiblings(
  departments: DepartmentTreeItemSchema[],
  parentId: string | null,
): DepartmentTreeItemSchema[] {
  if (!parentId) {
    return departments
  }

  return findDepartmentById(departments, parentId)?.children ?? []
}

export function getNextDepartmentOrder(
  departments: DepartmentTreeItemSchema[],
  parentId: string | null,
  excludeDepartmentId?: string,
): number {
  const siblings = getDepartmentSiblings(departments, parentId)
  const maxOrder = siblings.reduce((max, department) => {
    if (department.id === excludeDepartmentId) {
      return max
    }

    return Math.max(max, department.order)
  }, 0)

  return maxOrder + 1
}

export function countDepartmentTree(departments: DepartmentTreeItemSchema[]): number {
  return departments.reduce((count, department) => count + 1 + countDepartmentTree(department.children), 0)
}

export function applyDepartmentSiblingOrder(siblings: DepartmentTreeItemSchema[]): DepartmentTreeItemSchema[] {
  return siblings.map((department, index) => ({
    ...department,
    order: index + 1,
  }))
}

export function buildDepartmentSiblingReorder(
  siblingContextById: Map<string, DepartmentSiblingContext>,
  sourceId: string,
  targetId: string,
  position: DepartmentDropPosition,
): DepartmentSiblingReorderResult | null {
  const sourceContext = siblingContextById.get(sourceId)
  const targetContext = siblingContextById.get(targetId)

  if (!sourceContext || !targetContext || sourceContext.parentId !== targetContext.parentId) {
    return null
  }

  const nextSiblings = [...sourceContext.siblings]
  const [movedDepartment] = nextSiblings.splice(sourceContext.index, 1)
  if (!movedDepartment) {
    return null
  }

  let insertIndex = targetContext.index + (position === 'after' ? 1 : 0)
  if (sourceContext.index < insertIndex) {
    insertIndex -= 1
  }

  nextSiblings.splice(insertIndex, 0, movedDepartment)

  return {
    parentId: sourceContext.parentId,
    previousSiblings: sourceContext.siblings,
    nextSiblings: applyDepartmentSiblingOrder(nextSiblings),
  }
}

export function replaceDepartmentSiblings(
  departments: DepartmentTreeItemSchema[],
  parentId: string | null,
  siblings: DepartmentTreeItemSchema[],
): DepartmentTreeItemSchema[] {
  if (!parentId) {
    return siblings
  }

  for (let index = 0; index < departments.length; index += 1) {
    const department = departments[index]!

    if (department.id === parentId) {
      if (department.children === siblings) {
        return departments
      }

      return [
        ...departments.slice(0, index),
        {
          ...department,
          children: siblings,
        },
        ...departments.slice(index + 1),
      ]
    }

    const nextChildren = replaceDepartmentSiblings(department.children, parentId, siblings)
    if (nextChildren !== department.children) {
      return [
        ...departments.slice(0, index),
        {
          ...department,
          children: nextChildren,
        },
        ...departments.slice(index + 1),
      ]
    }
  }

  return departments
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
