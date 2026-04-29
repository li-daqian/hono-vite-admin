import { z } from '@hono/zod-openapi'

export const AppConfigResponseSchema = z.object({
  readOnlyMode: z.boolean().openapi({
    description: 'Whether the deployment disables business write operations',
    example: true,
  }),
  readOnlyMessage: z.string().openapi({
    description: 'Short user-facing message shown in the read-only banner',
    example: 'Demo read-only',
  }),
}).openapi('AppConfigResponseSchema')

export type AppConfigResponse = z.infer<typeof AppConfigResponseSchema>

export const LoginLockDurationValueSchema = z.string()
  .regex(/^[1-9]\d*[smhdwMy]$/, 'Use a duration like 15m, 2h, or 7d')
  .openapi({
    description: 'Account lock duration. Supported units: s, m, h, d, w, M, y.',
    example: '15m',
  })

export const AppSecurityPolicyResponseSchema = z.object({
  maxFailedLoginAttempts: z.number().int().min(1).openapi({
    description: 'Maximum consecutive failed login attempts before locking the account',
    example: 5,
  }),
  loginLockDuration: LoginLockDurationValueSchema,
  editable: z.boolean().openapi({
    description: 'Whether this deployment allows editing the security policy',
    example: false,
  }),
}).openapi('AppSecurityPolicyResponseSchema')
export type AppSecurityPolicyResponse = z.infer<typeof AppSecurityPolicyResponseSchema>

export const AppSecurityPolicyUpdateRequestSchema = z.object({
  maxFailedLoginAttempts: z.number().int().min(1).max(1000).openapi({
    description: 'Maximum consecutive failed login attempts before locking the account',
    example: 5,
  }),
  loginLockDuration: LoginLockDurationValueSchema,
})
export type AppSecurityPolicyUpdateRequest = z.infer<typeof AppSecurityPolicyUpdateRequestSchema>
