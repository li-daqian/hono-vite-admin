import type { OpenAPIHono, RouteConfig } from '@hono/zod-openapi'
import type { UserCreateRequest } from '@server/src/schemas/user.schema'
import { createRoute } from '@hono/zod-openapi'
import { UserCreateRequestSchema, UserCreateResponseSchema } from '@server/src/schemas/user.schema'
import { userService } from '@server/src/service/user.service'

const userCreationRoute: RouteConfig = createRoute({
  description: 'Create a new user',
  method: 'post',
  path: '/api/v1/user',
  request: { body: { content: { 'application/json': { schema: UserCreateRequestSchema } } } },
  responses: { 201: { description: 'User created successfully', content: { 'application/json': { schema: UserCreateResponseSchema } } } },
  security: [{ Bearer: [] }],
  tags: ['User'],
})

export function userRoute(api: OpenAPIHono) {
  // Create user api (protected)
  api.openapi(userCreationRoute, async (c) => {
    const body = await c.req.json<UserCreateRequest>()
    const createdUser = await userService.createUser(body)
    return c.json(createdUser, 201)
  })
}
