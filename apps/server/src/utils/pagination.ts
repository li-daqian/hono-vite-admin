import type { PaginatedResponse, PaginationQuery } from '@server/src/schemas/basic.schema'

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
