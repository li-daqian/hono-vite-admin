import type { DepartmentTreeItemSchema } from '@admin/client'
import { describe, expect, it } from 'vitest'
import {
  buildDepartmentSiblingReorder,
  buildDepartmentTreeIndexes,
  replaceDepartmentSiblings,
} from './department-utils'

function createDepartment(
  id: string,
  order: number,
  parentId: string | null = null,
  children: DepartmentTreeItemSchema[] = [],
): DepartmentTreeItemSchema {
  return {
    id,
    parentId,
    name: id,
    leaders: [],
    phone: null,
    email: null,
    order,
    status: 'ACTIVE',
    userCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    children,
  }
}

function createDepartmentTree(): DepartmentTreeItemSchema[] {
  const childA1 = createDepartment('a-1', 1, 'a')
  const childA2 = createDepartment('a-2', 2, 'a')
  const childB1 = createDepartment('b-1', 1, 'b')

  return [
    createDepartment('a', 1, null, [childA1, childA2]),
    createDepartment('b', 2, null, [childB1]),
  ]
}

describe('department utils', () => {
  it('builds sibling indexes for drag and drop lookups', () => {
    const tree = createDepartmentTree()
    const indexes = buildDepartmentTreeIndexes(tree)

    const childContext = indexes.siblingContextById.get('a-2')

    expect(indexes.nodeById.get('a-1')).toBe(tree[0]!.children[0]!)
    expect(childContext?.parentId).toBe('a')
    expect(childContext?.index).toBe(1)
    expect(childContext?.siblings).toBe(tree[0]!.children)
  })

  it('reorders departments only within the same parent', () => {
    const tree = createDepartmentTree()
    const indexes = buildDepartmentTreeIndexes(tree)

    const reordered = buildDepartmentSiblingReorder(indexes.siblingContextById, 'a-1', 'a-2', 'after')
    const invalidReorder = buildDepartmentSiblingReorder(indexes.siblingContextById, 'a-1', 'b-1', 'before')

    expect(reordered?.parentId).toBe('a')
    expect(reordered?.nextSiblings.map(department => department.id)).toEqual(['a-2', 'a-1'])
    expect(reordered?.nextSiblings.map(department => department.order)).toEqual([1, 2])
    expect(invalidReorder).toBeNull()
  })

  it('replaces only the affected branch when sibling order changes', () => {
    const tree = createDepartmentTree()
    const indexes = buildDepartmentTreeIndexes(tree)
    const reordered = buildDepartmentSiblingReorder(indexes.siblingContextById, 'a-1', 'a-2', 'after')

    const nextTree = replaceDepartmentSiblings(tree, reordered!.parentId, reordered!.nextSiblings)

    expect(nextTree).not.toBe(tree)
    expect(nextTree[0]).not.toBe(tree[0])
    expect(nextTree[1]).toBe(tree[1])
    expect(nextTree[0]!.children.map(department => department.id)).toEqual(['a-2', 'a-1'])
  })
})
