import { z } from '@hono/zod-openapi'

export const AuthPrefillResponseSchema = z.object({
  username: z.string().openapi({ description: 'Prefilled username for login form', example: 'admin' }),
  password: z.string().openapi({ description: 'Prefilled password for login form', example: 'admin@123!' }),
})
export type AuthPrefillResponse = z.infer<typeof AuthPrefillResponseSchema>

export const AuthLoginRequestSchema = z.object({
  username: z.string().trim().min(1).max(50).openapi({
    description: 'Username of the user',
    example: 'admin',
  }),

  password: z.string().min(1).openapi({
    description: 'Password of the user',
    example: 'Admin@123!',
  }),
})
export const AuthLoginResponseSchema = z.object({
  accessToken: z.string().openapi({ description: 'Access token for the user', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  refreshToken: z.string().openapi({ description: 'Refresh token for the user', example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...' }),
  refreshTokenExpiresAt: z.iso.datetime().openapi({ description: 'Refresh token expiry duration', example: '2024-12-31T23:59:59Z' }),
})
export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>

export const AuthRefreshRequestSchema = z.object({
  refreshToken: z.string().nullable().openapi({ description: 'Existing refresh token', example: 'f8b0c6ac-2f21-4e56-9f47-1b2a3c4d5e6f' }),
})
export const AuthRefreshResponseSchema = z.object({
  accessToken: z.string().openapi({ description: 'New access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  refreshToken: z.string().openapi({ description: 'Rotated refresh token', example: '9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' }),
  refreshTokenExpiresAt: z.iso.datetime().openapi({ description: 'New refresh token expiry duration', example: '2025-01-31T23:59:59Z' }),
})
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>

export const AuthMenuActionSchema = z.object({
  id: z.string().openapi({ description: 'Action ID', example: 'edit' }),
  name: z.string().openapi({ description: 'Action name', example: 'Edit' }),
})
export type AuthMenuAction = z.infer<typeof AuthMenuActionSchema>
export const AuthMenuSchema = z.object({
  id: z.string().openapi({ description: 'Menu ID', example: 'dashboard' }),
  name: z.string().openapi({ description: 'Menu name', example: 'Dashboard' }),
  path: z.string().nullable().openapi({ description: 'Menu path', example: '/dashboard' }),
  icon: z.string().nullable().openapi({ description: 'Menu icon', example: 'CircleGauge' }),
  get children(): z.ZodArray<typeof AuthMenuSchema> {
    return z.array(AuthMenuSchema).openapi({
      type: 'array',
      items: { $ref: '#/components/schemas/AuthMenuSchema' },
      description: 'Child menus',
      example: [{ id: 'analytics', name: 'Analytics', path: '/analytics', icon: 'BarChart', actions: [] }],
    })
  },
  actions: z.array(AuthMenuActionSchema).openapi({
    description: 'Menu actions',
    example: [{ id: 'edit', name: 'Edit' }],
  }),
}).openapi('AuthMenuSchema')
export type AuthMenu = z.infer<typeof AuthMenuSchema>
export const AuthMenuResponseSchema = z.array(AuthMenuSchema).openapi({ description: 'List of menus accessible to the user' })
export type AuthMenuResponse = z.infer<typeof AuthMenuResponseSchema>
