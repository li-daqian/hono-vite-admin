import { z } from '@hono/zod-openapi'

export const AuthLoginRequestSchema = z.object({
  username: z.string().openapi({ description: 'Username of the user', example: 'johndoe' }),
  password: z.string().openapi({ description: 'Password of the user', example: 'securePassword123' }),
})
export const AuthLoginResponseSchema = z.object({
  refreshToken: z.string().openapi({ description: 'Refresh token for the user', example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...' }),
})
export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>
