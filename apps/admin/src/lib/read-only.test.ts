import { describe, expect, it } from 'vitest'
import { isReadOnlyAction, shouldAllowReadOnlyRequest } from './read-only'

describe('read-only helpers', () => {
  it('identifies write actions from short and full action keys', () => {
    expect(isReadOnlyAction('edit')).toBe(true)
    expect(isReadOnlyAction('access.roles.permissions')).toBe(true)
    expect(isReadOnlyAction('view')).toBe(false)
  })

  it('allows safe requests and auth session mutations only', () => {
    expect(shouldAllowReadOnlyRequest('GET', '/user')).toBe(true)
    expect(shouldAllowReadOnlyRequest('POST', '/auth/login')).toBe(true)
    expect(shouldAllowReadOnlyRequest('POST', '/api/v1/auth/logout')).toBe(true)
    expect(shouldAllowReadOnlyRequest('PATCH', '/user/status')).toBe(false)
    expect(shouldAllowReadOnlyRequest('DELETE', '/api/v1/user/batch')).toBe(false)
  })
})
