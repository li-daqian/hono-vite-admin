import type { AuthMenuSchema } from '@admin/client'
import { describe, expect, it } from 'vitest'
import { normalizeAuthMenus } from './menu'

function menu(overrides: Partial<AuthMenuSchema> & Pick<AuthMenuSchema, 'id' | 'name'>): AuthMenuSchema {
  return {
    path: null,
    actions: [],
    children: [],
    ...overrides,
  }
}

describe('normalizeAuthMenus', () => {
  it('merges security policy actions into the system config menu', () => {
    const menus = [
      menu({
        id: 'system',
        name: 'System',
        children: [
          menu({
            id: 'system.security-policy',
            name: 'Security Policy',
            path: '/system/security-policy',
            actions: [{ id: 'system.security-policy.edit', name: 'Edit Security Policy' }],
          }),
          menu({
            id: 'system.configs',
            name: 'System Config',
            path: '/system/configs',
            actions: [{ id: 'system.configs.edit', name: 'Edit System Config' }],
          }),
          menu({
            id: 'system.dictionaries',
            name: 'Dictionaries',
            path: '/system/dictionaries',
          }),
        ],
      }),
    ]

    const normalized = normalizeAuthMenus(menus)

    expect(normalized[0]!.children.map(child => child.id)).toEqual([
      'system.configs',
      'system.dictionaries',
    ])
    expect(normalized[0]!.children[0]!.actions.map(action => action.id)).toEqual([
      'system.configs.edit',
      'system.security-policy.edit',
    ])
  })

  it('maps a security-policy-only legacy menu to the combined system config route', () => {
    const menus = [
      menu({
        id: 'system',
        name: 'System',
        children: [
          menu({
            id: 'system.security-policy',
            name: 'Security Policy',
            path: '/system/security-policy',
            actions: [{ id: 'system.security-policy.edit', name: 'Edit Security Policy' }],
          }),
        ],
      }),
    ]

    const normalized = normalizeAuthMenus(menus)

    expect(normalized[0]!.children).toEqual([
      {
        id: 'system.configs',
        name: 'System Config',
        path: '/system/configs',
        actions: [{ id: 'system.security-policy.edit', name: 'Edit Security Policy' }],
        children: [],
      },
    ])
  })
})
