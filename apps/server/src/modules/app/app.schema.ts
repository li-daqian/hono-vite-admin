import { z } from '@hono/zod-openapi'

export const AppConfigResponseSchema = z.object({
  readOnlyMode: z.boolean().openapi({
    description: 'Whether the deployment disables business write operations',
    example: true,
  }),
  readOnlyMessage: z.string().openapi({
    description: 'Short user-facing message for disabled write actions',
    example: 'Demo read-only',
  }),
}).openapi('AppConfigResponseSchema')

export type AppConfigResponse = z.infer<typeof AppConfigResponseSchema>
