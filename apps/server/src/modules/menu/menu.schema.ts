import { z } from '@hono/zod-openapi'

export const MenuActionSchema = z.object({
  id: z.string().openapi({ description: 'Action ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  name: z.string().openapi({ description: 'Action name', example: 'Edit' }),
  description: z.string().nullable().openapi({ description: 'Action description', example: 'Edit resource' }),
}).openapi('MenuActionSchema')
export type MenuAction = z.infer<typeof MenuActionSchema>

export const MenuItemSchema = z.object({
  id: z.string().openapi({ description: 'Menu ID', example: '01HZY4QG2R1X0ABCDEF1234567' }),
  name: z.string().openapi({ description: 'Menu name', example: 'Dashboard' }),
  path: z.string().nullable().openapi({ description: 'Menu path', example: '/dashboard' }),
  order: z.number().int().openapi({ description: 'Display order', example: 1 }),
  parentId: z.string().nullable().openapi({ description: 'Parent menu ID', example: null }),
  actions: z.array(MenuActionSchema).openapi({ description: 'Actions under this menu' }),
  get children(): z.ZodArray<typeof MenuItemSchema> {
    return z.array(MenuItemSchema).openapi({
      type: 'array',
      items: { $ref: '#/components/schemas/MenuItemSchema' },
      description: 'Child menus',
    })
  },
}).openapi('MenuItemSchema')
export type MenuItem = z.infer<typeof MenuItemSchema>

export const MenuTreeResponseSchema = z.array(MenuItemSchema).openapi('MenuTreeResponseSchema')
export type MenuTreeResponse = z.infer<typeof MenuTreeResponseSchema>
