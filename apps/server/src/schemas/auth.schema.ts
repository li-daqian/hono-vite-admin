import { z } from '@hono/zod-openapi'

export const AuthLoginRequestSchema = z.object({
  username: z.string().openapi({ description: 'Username of the user', example: 'admin' }),
  password: z.string().openapi({ description: 'Password of the user', example: 'admin@123!' }),
})
export const AuthLoginResponseSchema = z.object({
  refreshToken: z.string().openapi({ description: 'Refresh token for the user', example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...' }),
})
export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>

export const AuthRefreshRequestSchema = z.object({
  refreshToken: z.string().openapi({ description: 'Existing refresh token', example: 'f8b0c6ac-2f21-4e56-9f47-1b2a3c4d5e6f' }),
})
export const AuthRefreshResponseSchema = z.object({
  refreshToken: z.string().openapi({ description: 'Rotated refresh token', example: '9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' }),
})
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequestSchema>
export type AuthRefreshResponse = z.infer<typeof AuthRefreshResponseSchema>

export const AuthLogoutRequestSchema = z.object({
  refreshToken: z.string().openapi({ description: 'Refresh token to logout', example: 'f8b0c6ac-2f21-4e56-9f47-1b2a3c4d5e6f' }),
})
export const AuthLogoutResponseSchema = z.object({})
export type AuthLogoutRequest = z.infer<typeof AuthLogoutRequestSchema>
export type AuthLogoutResponse = z.infer<typeof AuthLogoutResponseSchema>
