import { extractClientIp, formatAuditExportDateTime, sanitizeAuditPayload } from '@server/src/modules/audit/audit.utils'
import { describe, expect, it } from 'bun:test'

describe('audit utils', () => {
  it('redacts sensitive fields recursively in audit snapshots', () => {
    const snapshot = sanitizeAuditPayload({
      username: 'alice',
      password: 'secret',
      nested: {
        confirmPassword: 'secret',
        refreshToken: 'refresh-token',
        profile: {
          authorization: 'Bearer abc',
        },
      },
      permissions: [
        {
          accessToken: 'token-1',
          value: 'kept',
        },
      ],
    })

    expect(snapshot).toEqual({
      username: 'alice',
      password: '[REDACTED]',
      nested: {
        confirmPassword: '[REDACTED]',
        refreshToken: '[REDACTED]',
        profile: {
          authorization: '[REDACTED]',
        },
      },
      permissions: [
        {
          accessToken: '[REDACTED]',
          value: 'kept',
        },
      ],
    })
  })

  it('extracts the first forwarded client ip', () => {
    const ip = extractClientIp({
      'x-forwarded-for': '203.0.113.10, 70.41.3.18',
    })

    expect(ip).toBe('203.0.113.10')
  })

  it('formats exported timestamps with the provided time zone', () => {
    const value = new Date(Date.UTC(2026, 4, 9, 7, 8, 9))

    expect(formatAuditExportDateTime(value, { locale: 'en-US', timeZone: 'Asia/Singapore' })).toBe('2026-05-09 15:08:09')
    expect(formatAuditExportDateTime(value, { locale: 'en-US', timeZone: 'UTC' })).toBe('2026-05-09 07:08:09')
  })
})
