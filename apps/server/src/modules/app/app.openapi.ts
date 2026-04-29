import { createRoute } from '@hono/zod-openapi'
import { authMiddleware } from '@server/src/middleware/auth.middleware'
import { requireActionPermission } from '@server/src/middleware/permission.middleware'
import {
  AppConfigResponseSchema,
  AppSecurityPolicyResponseSchema,
  AppSecurityPolicyUpdateRequestSchema,
} from '@server/src/modules/app/app.schema'

const APP_ACTIONS = {
  UPDATE_SECURITY_POLICY: 'system.security-policy.edit',
} as const

export const getAppConfigRoute: ReturnType<typeof createRoute> = createRoute({
  path: '/config',
  method: 'get',
  description: 'Get public application bootstrap config',
  responses: {
    200: { description: 'Application config retrieved successfully', content: { 'application/json': { schema: AppConfigResponseSchema } } },
  },
  tags: ['App'],
})

export const getAppSecurityPolicyRoute: ReturnType<typeof createRoute> = createRoute({
  path: '/security-policy',
  method: 'get',
  description: 'Get user security policy config',
  responses: {
    200: { description: 'Security policy retrieved successfully', content: { 'application/json': { schema: AppSecurityPolicyResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware],
  tags: ['App'],
})

export const updateAppSecurityPolicyRoute: ReturnType<typeof createRoute> = createRoute({
  path: '/security-policy',
  method: 'put',
  description: 'Update user security policy config',
  request: { body: { required: true, content: { 'application/json': { schema: AppSecurityPolicyUpdateRequestSchema } } } },
  responses: {
    200: { description: 'Security policy updated successfully', content: { 'application/json': { schema: AppSecurityPolicyResponseSchema } } },
  },
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireActionPermission(APP_ACTIONS.UPDATE_SECURITY_POLICY)],
  tags: ['App'],
})
