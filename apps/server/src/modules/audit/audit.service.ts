import type { PrismaClient } from '@server/generated/prisma/client'
import type { TransactionClient } from '@server/generated/prisma/internal/prismaNamespace'
import type {
  AuditCategory,
  AuditLogDetailResponse,
  AuditLogExportRequest,
  AuditLogFilterRequest,
  AuditLogListItem,
  AuditLogPaginationRequest,
  AuditLogPaginationResponse,
  AuditModule,
  AuditResult,
} from '@server/src/modules/audit/audit.schema'
import type { AuditJsonValue } from '@server/src/modules/audit/audit.utils'
import { Prisma } from '@server/generated/prisma/client'
import { AuditCategory as PrismaAuditCategory } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { prisma } from '@server/src/lib/prisma'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { getContext } from '@server/src/middleware/context.middleware'
import { getRequestId } from '@server/src/middleware/requestId.middleware'
import { extractClientIp, sanitizeAuditPayload } from '@server/src/modules/audit/audit.utils'
import { buildOrderBy, paginate } from '@server/src/utils/pagination'

export interface CreateAuditLogInput {
  category?: AuditCategory
  module: AuditModule
  action: string
  requestSnapshot?: unknown
  operator?: {
    operatorId: string | null
    operatorUsername: string
    operatorDisplayName?: string | null
  }
}

type AuditClient = PrismaClient | TransactionClient
type AuditOperator = NonNullable<CreateAuditLogInput['operator']>

const prismaAuditCategoryMap: Record<NonNullable<CreateAuditLogInput['category']>, PrismaAuditCategory> = {
  login: PrismaAuditCategory.LOGIN,
  operation: PrismaAuditCategory.OPERATION,
}

const apiAuditCategoryMap: Record<PrismaAuditCategory, AuditCategory> = {
  [PrismaAuditCategory.LOGIN]: 'login',
  [PrismaAuditCategory.OPERATION]: 'operation',
}

const AUDIT_EXPORT_HEADERS = [
  'Created At',
  'Category',
  'Module',
  'Action',
  'Result',
  'Failure Reason',
  'Operator Username',
  'Operator Display Name',
  'Method',
  'Path',
  'IP',
  'User Agent',
  'Request ID',
  'Request Snapshot',
]

function isAuditRecord(value: AuditJsonValue | undefined): value is Record<string, AuditJsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractAuditSnapshotMetadata(requestSnapshot: AuditJsonValue | undefined): {
  result: AuditResult | null
  failureReason: string | null
} {
  if (!isAuditRecord(requestSnapshot)) {
    return {
      result: null,
      failureReason: null,
    }
  }

  const result = requestSnapshot.result === 'success' || requestSnapshot.result === 'failure'
    ? requestSnapshot.result
    : null
  const snapshotFailureReason = typeof requestSnapshot.failureReason === 'string' && requestSnapshot.failureReason.trim()
    ? requestSnapshot.failureReason.trim()
    : null
  const snapshotReason = typeof requestSnapshot.reason === 'string' && requestSnapshot.reason.trim()
    ? requestSnapshot.reason.trim()
    : null

  return {
    result,
    failureReason: snapshotFailureReason ?? snapshotReason,
  }
}

function getDefaultAuditResult(category: NonNullable<CreateAuditLogInput['category']>): AuditResult | null {
  return category === 'operation' ? 'success' : null
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const text = typeof value === 'object'
    ? JSON.stringify(value)
    : String(value)

  return `"${text.replaceAll('"', '""')}"`
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',')
}

class AuditService {
  async record(client: AuditClient, input: CreateAuditLogInput): Promise<void> {
    if (getEnv().deployment.readOnlyMode) {
      return
    }

    const context = getContext()

    if (!context) {
      throw new Error('Audit logging requires an active request context.')
    }

    const requestSnapshot = sanitizeAuditPayload(input.requestSnapshot)
    const category = input.category ?? 'operation'
    const snapshotMetadata = extractAuditSnapshotMetadata(requestSnapshot)
    const operator = await this.resolveOperator(client, context, input.operator)

    await client.auditLog.create({
      data: {
        category: prismaAuditCategoryMap[category],
        module: input.module,
        action: input.action,
        operatorId: operator.operatorId,
        operatorUsername: operator.operatorUsername,
        operatorDisplayName: operator.operatorDisplayName ?? null,
        result: snapshotMetadata.result ?? getDefaultAuditResult(category),
        failureReason: snapshotMetadata.failureReason,
        method: context.req.method,
        path: context.req.path,
        ip: extractClientIp({
          'cf-connecting-ip': context.req.header('CF-Connecting-IP'),
          'x-forwarded-for': context.req.header('X-Forwarded-For'),
          'x-real-ip': context.req.header('X-Real-IP'),
          'forwarded': context.req.header('Forwarded'),
        }),
        userAgent: context.req.header('User-Agent')?.trim() || null,
        requestId: getRequestId(context),
        requestSnapshot: requestSnapshot === undefined
          ? undefined
          : requestSnapshot === null
            ? Prisma.JsonNull
            : requestSnapshot,
      },
    })
  }

  async getAuditLogPage(query: AuditLogPaginationRequest): Promise<AuditLogPaginationResponse> {
    const { page, pageSize, sort } = query
    const skip = (page - 1) * pageSize

    const where = this.buildAuditLogWhere(query)
    const orderBy = buildOrderBy(
      sort,
      ['createdAt', 'category', 'module', 'action', 'operatorUsername', 'result', 'failureReason'] as const,
      { createdAt: 'desc' },
    )

    const [total, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
    ])

    return paginate(auditLogs.map(log => this.mapAuditLogListItem(log)), total, query)
  }

  async exportAuditLogs(query: AuditLogExportRequest): Promise<string> {
    const where = this.buildAuditLogWhere(query)
    const orderBy = buildOrderBy(
      query.sort,
      ['createdAt', 'category', 'module', 'action', 'operatorUsername', 'result', 'failureReason'] as const,
      { createdAt: 'desc' },
    )

    const auditLogs = await prisma.auditLog.findMany({
      where,
      take: query.limit,
      orderBy,
    })

    return [
      csvRow(AUDIT_EXPORT_HEADERS),
      ...auditLogs.map(log => csvRow([
        log.createdAt.toISOString(),
        apiAuditCategoryMap[log.category],
        log.module,
        log.action,
        log.result,
        log.failureReason,
        log.operatorUsername,
        log.operatorDisplayName,
        log.method,
        log.path,
        log.ip,
        log.userAgent,
        log.requestId,
        log.requestSnapshot,
      ])),
    ].join('\n')
  }

  async getAuditLogById(id: string): Promise<AuditLogDetailResponse> {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    })

    if (!auditLog) {
      throw BusinessError.NotFound('Audit log not found')
    }

    return this.mapAuditLogDetail(auditLog)
  }

  private buildAuditLogWhere(query: AuditLogFilterRequest): Prisma.AuditLogWhereInput {
    const {
      search,
      operator,
      categories,
      modules,
      results,
      createdAtFrom,
      createdAtTo,
      failureReason,
    } = query
    const createdAtFromDate = this.parseDateFilter(createdAtFrom, 'createdAtFrom')
    const createdAtToDate = this.parseDateFilter(createdAtTo, 'createdAtTo')

    return {
      ...(categories && categories.length > 0
        ? {
            category: {
              in: categories.map(category => prismaAuditCategoryMap[category]),
            },
          }
        : {}),
      ...(modules && modules.length > 0
        ? {
            module: {
              in: modules,
            },
          }
        : {}),
      ...(results && results.length > 0
        ? {
            result: {
              in: results,
            },
          }
        : {}),
      ...(createdAtFromDate || createdAtToDate
        ? {
            createdAt: {
              ...(createdAtFromDate ? { gte: createdAtFromDate } : {}),
              ...(createdAtToDate ? { lte: createdAtToDate } : {}),
            },
          }
        : {}),
      ...(failureReason
        ? {
            failureReason: {
              contains: failureReason,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(operator
        ? {
            AND: [
              {
                OR: [
                  { operatorId: { contains: operator, mode: 'insensitive' } },
                  { operatorUsername: { contains: operator, mode: 'insensitive' } },
                  { operatorDisplayName: { contains: operator, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { module: { contains: search, mode: 'insensitive' } },
              { action: { contains: search, mode: 'insensitive' } },
              { operatorUsername: { contains: search, mode: 'insensitive' } },
              { operatorDisplayName: { contains: search, mode: 'insensitive' } },
              { result: { contains: search, mode: 'insensitive' } },
              { failureReason: { contains: search, mode: 'insensitive' } },
              { path: { contains: search, mode: 'insensitive' } },
              { requestId: { contains: search, mode: 'insensitive' } },
              { ip: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
  }

  private parseDateFilter(value: string | null, field: string): Date | undefined {
    if (!value) {
      return undefined
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw BusinessError.BadRequest(`${field} must be a valid ISO datetime`, 'InvalidAuditDateFilter')
    }

    return date
  }

  private mapAuditLogListItem(auditLog: {
    id: string
    category: PrismaAuditCategory
    module: string
    action: string
    operatorId: string | null
    operatorUsername: string
    operatorDisplayName: string | null
    result: string | null
    failureReason: string | null
    method: string
    path: string
    ip: string | null
    userAgent: string | null
    requestId: string
    createdAt: Date
  }): AuditLogListItem {
    return {
      id: auditLog.id,
      category: apiAuditCategoryMap[auditLog.category],
      module: auditLog.module as AuditModule,
      action: auditLog.action,
      operatorId: auditLog.operatorId,
      operatorUsername: auditLog.operatorUsername,
      operatorDisplayName: auditLog.operatorDisplayName,
      result: auditLog.result === 'success' || auditLog.result === 'failure' ? auditLog.result : null,
      failureReason: auditLog.failureReason,
      method: auditLog.method,
      path: auditLog.path,
      ip: auditLog.ip,
      userAgent: auditLog.userAgent,
      requestId: auditLog.requestId,
      createdAt: auditLog.createdAt.toISOString(),
    }
  }

  private mapAuditLogDetail(auditLog: {
    id: string
    category: PrismaAuditCategory
    module: string
    action: string
    operatorId: string | null
    operatorUsername: string
    operatorDisplayName: string | null
    result: string | null
    failureReason: string | null
    method: string
    path: string
    ip: string | null
    userAgent: string | null
    requestId: string
    requestSnapshot: unknown
    createdAt: Date
  }): AuditLogDetailResponse {
    return {
      ...this.mapAuditLogListItem(auditLog),
      requestSnapshot: auditLog.requestSnapshot,
    }
  }

  private async resolveOperator(
    client: AuditClient,
    context: NonNullable<ReturnType<typeof getContext>>,
    operator: CreateAuditLogInput['operator'],
  ): Promise<AuditOperator> {
    if (operator) {
      return {
        operatorId: operator.operatorId,
        operatorUsername: operator.operatorUsername,
        operatorDisplayName: operator.operatorDisplayName ?? null,
      }
    }

    const authPayload = getLoginUser(context)
    const userId = authPayload?.userId
    if (!userId) {
      return {
        operatorId: null,
        operatorUsername: 'anonymous',
        operatorDisplayName: null,
      }
    }

    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
      },
    })

    return {
      operatorId: userId,
      operatorUsername: user?.username ?? userId,
      operatorDisplayName: user?.displayName ?? null,
    }
  }
}

export const auditService = new AuditService()
