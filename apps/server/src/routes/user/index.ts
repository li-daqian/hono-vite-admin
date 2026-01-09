import type { OpenAPIHono } from '@hono/zod-openapi'
import type { UserCreateRequest } from '@server/src/routes/user/schema'
import { createRoute } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { UserCreateRequestSchema, UserCreateResponseSchema } from '@server/src/routes/user/schema'
import { userService } from '@server/src/service/user.service'

export function userRoute(api: OpenAPIHono) {
  api.openapi(createRoute({
    path: '/user',
    method: 'post',
    description: 'Create a new user',
    request: { body: { content: { 'application/json': { schema: UserCreateRequestSchema } } } },
    responses: { 201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } } },
    security: [{ Bearer: [] }],
    middleware: [authMiddleware],
    tags: ['User'],
  }), async (c) => {
    const body = await c.req.json<UserCreateRequest>()
    const createdUser = await userService.createUser(body)
    return c.json(createdUser, 201)
  })
}
