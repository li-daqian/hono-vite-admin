import type { PermissionTreeNode } from './model'
import { describe, expect, it } from 'vitest'
import { applyPermissionTemplate, diffPermissionTrees, getNodeCheckState, mergeEnabledPermissions, togglePermissionNode } from './model'

function createTree(): PermissionTreeNode[] {
  return [
    {
      id: 'settings',
      name: 'Settings',
      type: 'MENU',
      description: '/settings',
      enable: false,
      children: [
        {
          id: 'settings:view',
          name: 'View',
          type: 'ACTION',
          description: 'View settings',
          enable: false,
          children: [],
        },
        {
          id: 'users',
          name: 'Users',
          type: 'MENU',
          description: '/settings/users',
          enable: false,
          children: [
            {
              id: 'users:edit',
              name: 'Edit',
              type: 'ACTION',
              description: 'Edit users',
              enable: false,
              children: [],
            },
          ],
        },
      ],
    },
  ]
}

describe('permission tree model', () => {
  it('marks ancestors enabled when a child action is toggled on', () => {
    const nextTree = togglePermissionNode(createTree(), 'users:edit', true)
    const settingsNode = nextTree[0]!
    const usersNode = settingsNode.children[1]!

    expect(settingsNode.enable).toBe(true)
    expect(usersNode.enable).toBe(true)
    expect(usersNode.children[0]!.enable).toBe(true)
    expect(getNodeCheckState(settingsNode)).toBe('indeterminate')
  })

  it('keeps ancestors enabled when the last selected descendant is toggled off', () => {
    const enabledTree = togglePermissionNode(createTree(), 'users:edit', true)
    const nextTree = togglePermissionNode(enabledTree, 'users:edit', false)
    const settingsNode = nextTree[0]!
    const usersNode = settingsNode.children[1]!

    expect(settingsNode.enable).toBe(true)
    expect(usersNode.enable).toBe(true)
    expect(usersNode.children[0]!.enable).toBe(false)
    expect(getNodeCheckState(usersNode)).toBe(true)
    expect(getNodeCheckState(settingsNode)).toBe('indeterminate')
  })

  it('toggles a menu recursively for all descendants', () => {
    const nextTree = togglePermissionNode(createTree(), 'settings', true)
    const settingsNode = nextTree[0]!
    const usersNode = settingsNode.children[1]!

    expect(getNodeCheckState(settingsNode)).toBe(true)
    expect(settingsNode.children.every(child => child.enable)).toBe(true)
    expect(usersNode.children[0]!.enable).toBe(true)
  })

  it('applies built-in permission templates', () => {
    const navigationTree = applyPermissionTemplate(createTree(), 'navigation')
    const fullTree = applyPermissionTemplate(createTree(), 'full')
    const emptyTree = applyPermissionTemplate(fullTree, 'empty')

    expect(navigationTree[0]!.enable).toBe(true)
    expect(navigationTree[0]!.children[0]!.enable).toBe(false)
    expect(navigationTree[0]!.children[1]!.enable).toBe(true)
    expect(fullTree[0]!.children[1]!.children[0]!.enable).toBe(true)
    expect(emptyTree[0]!.enable).toBe(false)
  })

  it('diffs added and removed permission entries', () => {
    const before = togglePermissionNode(createTree(), 'settings', true)
    const after = togglePermissionNode(before, 'settings:view', false)
    const diff = diffPermissionTrees(before, after)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([
      expect.objectContaining({
        key: 'ACTION:settings:view',
        path: ['Settings', 'View'],
      }),
    ])
  })

  it('merges enabled grant permissions without revoking existing permissions', () => {
    const base = togglePermissionNode(createTree(), 'settings:view', true)
    const grants = togglePermissionNode(createTree(), 'users:edit', true)
    const nextTree = mergeEnabledPermissions(base, grants)

    expect(nextTree[0]!.enable).toBe(true)
    expect(nextTree[0]!.children[0]!.enable).toBe(true)
    expect(nextTree[0]!.children[1]!.enable).toBe(true)
    expect(nextTree[0]!.children[1]!.children[0]!.enable).toBe(true)
  })
})
