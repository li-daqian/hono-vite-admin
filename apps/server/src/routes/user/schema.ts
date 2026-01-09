import { z } from '@hono/zod-openapi'

export const UserCreateRequestSchema = z.object({
  username: z.string().min(3).max(30).openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  password: z.string().min(6).max(100).openapi({ description: 'Password for the user', example: 'securePassword123' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().min(10).max(15).nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().max(50).nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
})
export const UserCreateResponseSchema = z.object({
  id: z.uuid().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  createdAt: z.string().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.string().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
})
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>
export type UserCreateResponse = z.infer<typeof UserCreateResponseSchema>

export const UserProfileResponseSchema = z.object({
  id: z.uuid().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  createdAt: z.string().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.string().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
})
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>
