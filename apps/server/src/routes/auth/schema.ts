import { z } from '@hono/zod-openapi'

export const AuthLoginRequestSchema = z.object({
  username: z.string().openapi({ description: 'Username of the user', example: 'admin' }),
  password: z.string().openapi({ description: 'Password of the user', example: 'admin@123!' }),
})
export const AuthLoginResponseSchema = z.object({
  accessToken: z.string().openapi({ description: 'Access token for the user', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  refreshToken: z.string().openapi({ description: 'Refresh token for the user', example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...' }),
  refreshTokenExpiresAt: z.string().openapi({ description: 'Refresh token expiry duration', example: '2024-12-31T23:59:59Z' }),
})
export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>

export const AuthRefreshRequestSchema = z.object({
  refreshToken: z.string().nullable().openapi({ description: 'Existing refresh token', example: 'f8b0c6ac-2f21-4e56-9f47-1b2a3c4d5e6f' }),
})
export const AuthRefreshResponseSchema = z.object({
  accessToken: z.string().openapi({ description: 'New access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  refreshToken: z.string().openapi({ description: 'Rotated refresh token', example: '9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' }),
  refreshTokenExpiresAt: z.string().openapi({ description: 'New refresh token expiry duration', example: '2025-01-31T23:59:59Z' }),
})
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>

export const AuthLogoutRequestSchema = z.object({})
export const AuthLogoutResponseSchema = z.object({})
export type AuthLogoutRequest = z.infer<typeof AuthLogoutRequestSchema>
export type AuthLogoutResponse = z.infer<typeof AuthLogoutResponseSchema>
