import { PermissionType } from '@server/generated/prisma/enums'
import { buildRolePermissionsTree, flattenEnabledRolePermissions } from '@server/src/modules/role/role-permission-tree'
import { describe, expect, it } from 'bun:test'

describe('role permission tree helpers', () => {
  it('builds a role permission tree with enable flags from granted permissions', () => {
    const tree = buildRolePermissionsTree(
      [
        { id: 'settings', parentId: null, name: 'Settings', path: '/settings', order: 2 },
        { id: 'dashboard', parentId: null, name: 'Dashboard', path: '/dashboard', order: 1 },
        { id: 'users', parentId: 'settings', name: 'Users', path: '/settings/users', order: 1 },
      ],
      [
        { id: 'settings:view', menuId: 'settings', name: 'View', description: 'View settings' },
        { id: 'users:edit', menuId: 'users', name: 'Edit', description: 'Edit users' },
      ],
      [
        { type: PermissionType.MENU, targetId: 'settings' },
        { type: PermissionType.MENU, targetId: 'users' },
        { type: PermissionType.ACTION, targetId: 'users:edit' },
      ],
    )

    expect(tree).toEqual([
      {
        id: 'dashboard',
        name: 'Dashboard',
        type: PermissionType.MENU,
        description: '',
        enable: false,
        children: [],
      },
      {
        id: 'settings',
        name: 'Settings',
        type: PermissionType.MENU,
        description: '',
        enable: true,
        children: [
          {
            id: 'settings:view',
            name: 'View',
            type: PermissionType.ACTION,
            description: 'View settings',
            enable: false,
            children: [],
          },
          {
            id: 'users',
            name: 'Users',
            type: PermissionType.MENU,
            description: '',
            enable: true,
            children: [
              {
                id: 'users:edit',
                name: 'Edit',
                type: PermissionType.ACTION,
                description: 'Edit users',
                enable: true,
                children: [],
              },
            ],
          },
        ],
      },
    ])
  })

  it('flattens enabled nodes into permission entries', () => {
    const permissions = flattenEnabledRolePermissions([
      {
        id: 'settings',
        name: 'Settings',
        type: PermissionType.MENU,
        description: '/settings',
        enable: true,
        children: [
          {
            id: 'settings:view',
            name: 'View',
            type: PermissionType.ACTION,
            description: 'View settings',
            enable: false,
            children: [],
          },
          {
            id: 'users',
            name: 'Users',
            type: PermissionType.MENU,
            description: '/settings/users',
            enable: true,
            children: [
              {
                id: 'users:edit',
                name: 'Edit',
                type: PermissionType.ACTION,
                description: 'Edit users',
                enable: true,
                children: [],
              },
            ],
          },
        ],
      },
    ])

    expect(permissions).toEqual([
      { type: PermissionType.MENU, targetId: 'settings' },
      { type: PermissionType.MENU, targetId: 'users' },
      { type: PermissionType.ACTION, targetId: 'users:edit' },
    ])
  })
})
