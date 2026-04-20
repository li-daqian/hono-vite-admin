const REDACTED_AUDIT_VALUE = '[REDACTED]'

export type AuditJsonValue
  = | string
    | number
    | boolean
    | null
    | AuditJsonValue[]
    | { [key: string]: AuditJsonValue }

function normalizeAuditKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isSensitiveAuditKey(key: string): boolean {
  const normalizedKey = normalizeAuditKey(key)

  return normalizedKey === 'salt'
    || normalizedKey.endsWith('token')
    || normalizedKey.includes('password')
    || normalizedKey.includes('authorization')
}

function sanitizeAuditValue(value: unknown, seen: WeakSet<object>): AuditJsonValue {
  if (value === null) {
    return value
  }

  if (value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeAuditValue(item, seen))
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  if (seen.has(value)) {
    return '[Circular]'
  }

  seen.add(value)

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      isSensitiveAuditKey(key) ? REDACTED_AUDIT_VALUE : sanitizeAuditValue(nestedValue, seen),
    ]),
  )
}

export function sanitizeAuditPayload(value: unknown): AuditJsonValue | undefined {
  if (value === undefined) {
    return undefined
  }

  return sanitizeAuditValue(value, new WeakSet())
}

function normalizeClientIp(value: string | null | undefined): string | null {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  return trimmed
    .replace(/^for=/i, '')
    .replace(/^"|"$/g, '')
    .replace(/^\[|\]$/g, '')
    .trim() || null
}

export function extractClientIp(headers: Record<string, string | null | undefined>): string | null {
  const xForwardedFor = headers['x-forwarded-for']
    ?.split(',')
    .map(candidate => normalizeClientIp(candidate))
    .find(Boolean)

  if (xForwardedFor) {
    return xForwardedFor
  }

  const directHeaders = [
    headers['cf-connecting-ip'],
    headers['x-real-ip'],
  ]
    .map(candidate => normalizeClientIp(candidate))
    .find(Boolean)

  if (directHeaders) {
    return directHeaders
  }

  const forwarded = headers.forwarded
  if (!forwarded) {
    return null
  }

  const forwardedPart = forwarded
    .split(';')
    .map(part => part.trim())
    .find(part => part.toLowerCase().startsWith('for='))

  return normalizeClientIp(forwardedPart)
}
