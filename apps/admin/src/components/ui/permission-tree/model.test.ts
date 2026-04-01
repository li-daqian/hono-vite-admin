import type { PermissionTreeNode } from './model'
import { describe, expect, it } from 'vitest'
import { getNodeCheckState, togglePermissionNode } from './model'

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

  it('clears ancestors when the last selected descendant is toggled off', () => {
    const enabledTree = togglePermissionNode(createTree(), 'users:edit', true)
    const nextTree = togglePermissionNode(enabledTree, 'users:edit', false)
    const settingsNode = nextTree[0]!
    const usersNode = settingsNode.children[1]!

    expect(settingsNode.enable).toBe(false)
    expect(usersNode.enable).toBe(false)
    expect(usersNode.children[0]!.enable).toBe(false)
    expect(getNodeCheckState(settingsNode)).toBe(false)
  })

  it('toggles a menu recursively for all descendants', () => {
    const nextTree = togglePermissionNode(createTree(), 'settings', true)
    const settingsNode = nextTree[0]!
    const usersNode = settingsNode.children[1]!

    expect(getNodeCheckState(settingsNode)).toBe(true)
    expect(settingsNode.children.every(child => child.enable)).toBe(true)
    expect(usersNode.children[0]!.enable).toBe(true)
  })
})
