import type { OpenAPIHono } from '@hono/zod-openapi'
import type { UserCreateRequest } from '@server/src/schemas/user.schema'
import { createRoute } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { GlobalErrorResponses } from '@server/src/openapi/errors'
import { UserCreateRequestSchema, UserCreateResponseSchema, UserProfileResponseSchema } from '@server/src/schemas/user.schema'
import { userService } from '@server/src/service/user.service'

export function userRoute(api: OpenAPIHono) {
  api.openapi(createRoute({
    path: '/user',
    method: 'post',
    description: 'Create a new user',
    request: { body: { required: true, content: { 'application/json': { schema: UserCreateRequestSchema } } } },
    responses: {
      201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } },
      ...GlobalErrorResponses,
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
      ...GlobalErrorResponses,
    },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['User'],
  }), async (c) => {
    const userProfile = await userService.getUserProfile()
    return c.json(userProfile, 200)
  })
}
