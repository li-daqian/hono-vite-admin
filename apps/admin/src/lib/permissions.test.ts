import { useAppConfigStore } from '@admin/stores/app-config'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildActionPermissionId,
  createPermissionDeniedMessage,
  createPermissionSource,
  resolveActionPermission,
} from './permissions'

describe('permissions helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('builds a full action permission id from the current menu id', () => {
    expect(buildActionPermissionId('access.users', 'create')).toBe('access.users.create')
    expect(buildActionPermissionId('access.users', 'access.users.delete')).toBe('access.users.delete')
  })

  it('prefers the live menu source over route meta fallback', () => {
    const source = createPermissionSource(
      {
        menuId: 'access.roles',
        actions: [{ id: 'access.roles.permissions', name: 'Manage Permissions' }],
      },
      {
        menuId: 'stale.route',
        actions: [{ id: 'stale.route.edit', name: 'Edit' }],
      },
    )

    expect(source).toEqual({
      menuId: 'access.roles',
      actions: [{ id: 'access.roles.permissions', name: 'Manage Permissions' }],
    })
  })

  it('resolves an allowed action from a short action key', () => {
    const permission = resolveActionPermission(
      {
        menuId: 'access.users',
        actions: [{ id: 'access.users.edit', name: 'Edit' }],
      },
      'edit',
      { subject: 'users' },
    )

    expect(permission).toEqual({
      allowed: true,
      actionId: 'access.users.edit',
      actionName: 'Edit',
      reason: null,
    })
  })

  it('returns a friendly denial message when the action is missing', () => {
    const permission = resolveActionPermission(
      {
        menuId: 'access.roles',
        actions: [{ id: 'access.roles.create', name: 'Create' }],
      },
      'permissions',
      {
        actionName: 'manage role permissions',
      },
    )

    expect(permission).toEqual({
      allowed: false,
      actionId: 'access.roles.permissions',
      actionName: 'manage role permissions',
      reason: 'You do not have permission to manage role permissions on this page.',
    })
  })

  it('denies write actions with a read-only message in read-only mode', () => {
    const appConfigStore = useAppConfigStore()
    appConfigStore.readOnlyMode = true
    appConfigStore.readOnlyMessage = 'Demo read-only'

    const permission = resolveActionPermission(
      {
        menuId: 'access.users',
        actions: [{ id: 'access.users.edit', name: 'Edit' }],
      },
      'edit',
      { subject: 'users' },
    )

    expect(permission).toEqual({
      allowed: false,
      actionId: 'access.users.edit',
      actionName: 'Edit',
      reason: 'Demo read-only',
    })
  })

  it('formats generic denial messages consistently', () => {
    expect(createPermissionDeniedMessage('Create', 'users')).toBe('You do not have permission to create users.')
    expect(createPermissionDeniedMessage('Edit')).toBe('You do not have permission to edit on this page.')
  })
})
