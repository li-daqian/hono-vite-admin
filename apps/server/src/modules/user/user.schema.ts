import { z } from '@hono/zod-openapi'
import { UserStatus } from '@server/generated/prisma/enums'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@server/src/common/basic.schema'

function emptyStringToUndefined(value: unknown) {
  return value === '' ? undefined : value
}

export const UserCreateRequestSchema = z.object({
  username: z.string().min(3).max(30).openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  password: z.string().min(6).max(100).openapi({ description: 'Password for the user', example: 'securePassword123' }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().min(10).max(15).nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().max(50).nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  roleIds: z.array(z.string().min(1)).optional().openapi({ description: 'Role IDs to assign to the user', example: ['01HZY4QG2R1X0ABCDEF1234567'] }),
})
export const UserRoleResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the role', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  name: z.string().openapi({ description: 'Unique role name', example: 'admin' }),
})
export const UserCreateResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  roles: z.array(UserRoleResponseSchema).openapi({
    description: 'Roles assigned to the user',
    example: [
      { id: '01HZY4QG2R1X0ABCDEF1234567', name: 'admin' },
      { id: '01HZY4QG2R1X0ABCDEF1234568', name: 'operator' },
    ],
  }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
})
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>
export type UserCreateResponse = z.infer<typeof UserCreateResponseSchema>

export const UserUpdateRequestSchema = z.object({
  username: z.string().min(3).max(30).optional().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  email: z.email().nullable().optional().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().min(10).max(15).nullable().optional().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().max(50).nullable().optional().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  status: z.enum(Object.values(UserStatus)).optional().openapi({ description: 'Status of the user account', example: UserStatus.ACTIVE }),
  roleIds: z.array(z.string().min(1)).optional().openapi({ description: 'Role IDs to assign to the user', example: ['01HZY4QG2R1X0ABCDEF1234567'] }),
}).refine(value => Object.keys(value).length > 0, {
  message: 'At least one field must be provided for update',
})
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>

export const UserBatchDeleteRequestSchema = z.object({
  userIds: z.array(z.string()).min(1).openapi({ description: 'IDs of users to delete', example: ['01HZY4QG2R1X0ABCDEF1234567'] }),
})
export const UserBatchDeleteResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative().openapi({ description: 'Number of users deleted', example: 2 }),
})
export type UserBatchDeleteRequest = z.infer<typeof UserBatchDeleteRequestSchema>
export type UserBatchDeleteResponse = z.infer<typeof UserBatchDeleteResponseSchema>

export const UserBatchStatusUpdateRequestSchema = z.object({
  userIds: z.array(z.string()).min(1).openapi({ description: 'IDs of users to update status', example: ['01HZY4QG2R1X0ABCDEF1234567'] }),
  status: z.enum(Object.values(UserStatus)).openapi({ description: 'Target status for users', example: UserStatus.DISABLED }),
})
export const UserBatchStatusUpdateResponseSchema = z.object({
  updatedCount: z.number().int().nonnegative().openapi({ description: 'Number of users updated', example: 3 }),
})
export type UserBatchStatusUpdateRequest = z.infer<typeof UserBatchStatusUpdateRequestSchema>
export type UserBatchStatusUpdateResponse = z.infer<typeof UserBatchStatusUpdateResponseSchema>

export const UserProfileResponseSchema = z.object({
  id: z.string().openapi({ description: 'Unique identifier for the user', example: '550e8400-e29b-41d4-a716-446655440000' }),
  username: z.string().openapi({ description: 'Unique username for the user', example: 'johndoe' }),
  roles: z.array(UserRoleResponseSchema).openapi({
    description: 'Roles assigned to the user',
    example: [
      { id: '01HZY4QG2R1X0ABCDEF1234567', name: 'admin' },
      { id: '01HZY4QG2R1X0ABCDEF1234568', name: 'operator' },
    ],
  }),
  email: z.email().nullable().openapi({ description: 'Email address of the user', example: 'johndoe@example.com' }),
  phone: z.string().nullable().openapi({ description: 'Phone number of the user', example: '+1234567890' }),
  displayName: z.string().nullable().openapi({ description: 'Display name of the user', example: 'John Doe' }),
  status: z.enum(Object.values(UserStatus)).openapi({ description: 'Status of the user account', example: UserStatus.ACTIVE }),
  createdAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was created', example: '2024-01-01T12:00:00Z' }),
  updatedAt: z.iso.datetime().openapi({ description: 'Timestamp when the user was last updated', example: '2024-01-02T12:00:00Z' }),
}).openapi('UserProfileResponseSchema')
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>

export const UserPaginationRequestSchema = PaginationQuerySchema.extend({
  search: z.preprocess(emptyStringToUndefined, z.string().max(100).nullable().default(null)).openapi({ description: 'Search term for filtering users by username, email, or display name', example: 'john' }),
  status: z.preprocess(
    (val) => {
      // If it's an empty string, return undefined so it hits the default
      if (val === '')
        return undefined
        // If it's a single string, wrap it in an array for the array schema
      if (typeof val === 'string')
        return [val]
      return val
    },
    z.array(z.enum(UserStatus)).nullable().default(null),
  )
    .openapi({
      description: 'Filter users by one or more account statuses',
      example: [UserStatus.ACTIVE, UserStatus.DISABLED],
    }),
  roleIds: z.preprocess(
    (val) => {
      if (val === '')
        return undefined
      if (typeof val === 'string')
        return [val]
      return val
    },
    z.array(z.string()).nullable().default(null),
  )
    .openapi({
      description: 'Filter users by one or more role IDs',
      example: ['01HZY4QG2R1X0ABCDEF1234567'],
    }),
})
export type UserPaginationRequest = z.infer<typeof UserPaginationRequestSchema>
export const UserPaginationResponseSchema = PaginatedResponseSchema(UserProfileResponseSchema)
export type UserPaginationResponse = z.infer<typeof UserPaginationResponseSchema>
