import { z } from '@hono/zod-openapi'
import { UserStatus } from '@server/generated/prisma/enums'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@server/src/schemas/basic.schema'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

export const UserCreateRequestSchema = z.object({
  username: z.string().min(3).max(30).openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  password: z.string().min(6).max(100).openapi({ description: 'Password for the user', example: 'securePassword123' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().min(10).max(15).nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().max(50).nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
})
export const UserCreateResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
})
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>
export type UserCreateResponse = z.infer<typeof UserCreateResponseSchema>

export const UserProfileResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  status: z.enum(Object.values(UserStatus)).openapi({ description: 'Status of the user account', example: UserStatus.ACTIVE }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
})
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>

export const UserPaginationRequestSchema = PaginationQuerySchema.extend({
  search: z.preprocess(emptyStringToUndefined, z.string().max(100).nullable().default(null)).openapi({ description: 'Search term for filtering users by username, email, or display name', example: 'john' }),
  status: z.preprocess(emptyStringToUndefined, z.enum(Object.values(UserStatus)).nullable().default(null)).openapi({ description: 'Filter users by account status', example: UserStatus.ACTIVE }),
})
export type UserPaginationRequest = z.infer<typeof UserPaginationRequestSchema>
export const UserPaginationResponseSchema = PaginatedResponseSchema(UserProfileResponseSchema)
export type UserPaginationResponse = z.infer<typeof UserPaginationResponseSchema>
