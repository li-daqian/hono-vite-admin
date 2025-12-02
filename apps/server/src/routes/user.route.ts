import type { OpenAPIHono, RouteConfig } from '@hono/zod-openapi'
import type { UserCreateRequest } from '@server/src/schemas/user.schema'
import { createRoute } from '@hono/zod-openapi'
import { UserCreateRequestSchema, UserCreateResponseSchema } from '@server/src/schemas/user.schema'
import { userService } from '@server/src/service/user.service'

const createUserRoute: RouteConfig = createRoute({
  method: 'post',
  path: '/api/user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserCreateRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: UserCreateResponseSchema,
        },
      },
    },
  },
  tags: ['User'],
})

export function registerUserRoute(api: OpenAPIHono) {
  api.openapi(createUserRoute, async (c) => {
    const body = await c.req.json<UserCreateRequest>()
    const createdUser = await userService.createUser(body)
    return c.json(
      createdUser,
      201,
    )
  })
}
