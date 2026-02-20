import type { OpenAPIHono } from '@hono/zod-openapi'
import type { UserCreateRequest } from '@server/src/schemas/user.schema'
import { createRoute } from '@hono/zod-openapi'
import { authMiddleware, getLoginUser } from '@server/src/middleware/auth.middleware'
import { UserCreateRequestSchema, UserCreateResponseSchema, UserPaginationRequestSchema, UserPaginationResponseSchema, UserProfileResponseSchema } from '@server/src/schemas/user.schema'
import { userService } from '@server/src/service/user.service'

export function userRoute(api: OpenAPIHono) {
  api.openapi(createRoute({
    path: '/user',
    method: 'post',
    description: 'Create a new user',
    request: { body: { required: true, content: { 'application/json': { schema: UserCreateRequestSchema } } } },
    responses: {
      201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } },
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['User'],
  }), async (c) => {
    const body = await c.req.json<UserCreateRequest>()
    const createdUser = await userService.createUser(body)
    return c.json(createdUser, 201)
  })

  api.openapi(createRoute({
    path: '/user/profile',
    method: 'get',
    description: 'Get user profile',
    responses: {
      200: { description: 'User profile retrieved successfully', content: { 'application/json': { schema: UserProfileResponseSchema } } },
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['User'],
  }), async (c) => {
    const { userId } = getLoginUser(c)
    const userProfile = await userService.getUserProfile(userId)
    return c.json(userProfile, 200)
  })

  api.openapi(createRoute({
    path: '/user/page',
    method: 'get',
    description: 'Get paginated list of users',
    request: {
      query: UserPaginationRequestSchema,
    },
    responses: {
      200: { description: 'User list retrieved successfully', content: { 'application/json': { schema: UserPaginationResponseSchema } } },
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['User'],
  }), async (c) => {
    const query = c.req.valid('query')
    const userPage = await userService.getUserPage(query)
    return c.json(userPage, 200)
  })
}
