export const READ_ONLY_MODE_MESSAGE = 'Demo read-only'

const SAFE_READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const READ_ONLY_MUTATION_ALLOWLIST = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
])
const READ_ONLY_ACTION_KEYS = new Set([
  'add',
  'assign',
  'create',
  'delete',
  'edit',
  'password',
  'permissions',
  'remove',
  'reorder',
  'unlock',
  'update',
])

export function isReadOnlyAction(actionKey: string): boolean {
  const actionSegments = actionKey.split(/[.:/]/)
  const normalizedActionKey = actionSegments[actionSegments.length - 1]
    ?.trim()
    .toLowerCase()

  return normalizedActionKey ? READ_ONLY_ACTION_KEYS.has(normalizedActionKey) : false
}

function normalizeRequestPath(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname
  }
  catch {
    const [path = ''] = url.split('?')
    return path.startsWith('/') ? path : `/${path}`
  }
}

export function shouldAllowReadOnlyRequest(method = 'GET', url = ''): boolean {
  if (SAFE_READ_ONLY_METHODS.has(method.toUpperCase())) {
    return true
  }

  return READ_ONLY_MUTATION_ALLOWLIST.has(normalizeRequestPath(url))
}
