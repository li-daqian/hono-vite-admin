import type { PaginatedResponse, PaginationQuery } from '@server/src/schemas/basic.schema'
import { BusinessError } from '@server/src/common/exception'

type SortDirection = 'asc' | 'desc'

/**
 * Builds a validated Prisma-style orderBy value from a sort string.
 *
 * Accepts sort input in the format "field direction" (for example: "createdAt desc")
 * and multi-field sort input in the format "field direction, field direction"
 * (for example: "createdAt desc, username asc").
 * If sort is null/empty, returns the provided default order.
 *
 * @typeParam TField - Union of allowed sortable field names.
 * @param sort - Raw sort string from request query.
 * @param allowedFields - Whitelist of sortable fields.
 * @param defaultOrder - Fallback order when sort is not provided.
 * @returns A partial orderBy object/array containing validated sort fields and directions,
 * or defaultOrder when sort is absent.
 * @throws BusinessError.BadRequest - When sort format is invalid.
 * @throws BusinessError.BadRequest - When sort direction is not "asc" or "desc".
 * @throws BusinessError.BadRequest - When sort field is not in allowedFields.
 */
export function buildOrderBy<TField extends string>(
  sort: string | null,
  allowedFields: readonly TField[],
  defaultOrder: Partial<Record<TField, SortDirection>>,
): Partial<Record<TField, SortDirection>> | Partial<Record<TField, SortDirection>>[] {
  if (!sort) {
    return defaultOrder
  }

  const clauses = sort
    .split(',')
    .map(clause => clause.trim())
    .filter(Boolean)

  if (clauses.length === 0) {
    throw BusinessError.BadRequest(
      'Invalid sort format. Use "field direction", e.g. "createdAt desc"',
      'InvalidSort',
    )
  }

  const orderBy = clauses.map((clause) => {
    const [field, direction, ...rest] = clause.split(/\s+/)

    if (!field || !direction || rest.length > 0) {
      throw BusinessError.BadRequest(
        'Invalid sort format. Use "field direction" or "field direction, field direction"',
        'InvalidSort',
      )
    }

    const normalizedDirection = direction.toLowerCase()

    if (normalizedDirection !== 'asc' && normalizedDirection !== 'desc') {
      throw BusinessError.BadRequest(
        'Invalid sort direction. Use "asc" or "desc"',
        'InvalidSortDirection',
      )
    }

    if (!allowedFields.includes(field as TField)) {
      throw BusinessError.BadRequest(
        `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
        'InvalidSortField',
      )
    }

    const typedField = field as TField
    return {
      [typedField]: normalizedDirection,
    } as Partial<Record<TField, SortDirection>>
  })

  return orderBy.length === 1 ? orderBy[0]! : orderBy
}

/**
 * Utility function to paginate an array of items based on the provided pagination query.
 * This function calculates the total number of pages, determines if there are next or previous pages,
 * and returns a paginated response object containing the current page of items and pagination metadata.
 *
 * @param items - The array of items to paginate (should already be sliced according to the page and pageSize).
 * @param total - The total number of items available (before pagination).
 * @param query - The pagination query containing page, pageSize, and sort information.
 * @returns A paginated response object containing the paginated items and metadata.
 */
export function paginate<T>(items: T[], total: number, query: PaginationQuery): PaginatedResponse<T> {
  const { page, pageSize, sort } = query
  const totalPages = Math.ceil(total / pageSize)
  const hasNext = page < totalPages
  const hasPrevious = page > 1

  return {
    items,
    meta: {
      total,
      page,
      pageSize,
      hasNext,
      hasPrevious,
      sort,
    },
  }
}
