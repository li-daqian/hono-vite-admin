import { ErrorResponseSchema } from '@server/src/schemas/basic.schema'

interface GlobalErrorResponseEntry {
  description: string
  content: {
    'application/json': {
      schema: typeof ErrorResponseSchema
    }
  }
}

export const GlobalErrorResponses: Record<400 | 401 | 403 | 404 | 500, GlobalErrorResponseEntry> = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
}
