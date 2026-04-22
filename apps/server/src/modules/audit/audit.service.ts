import type { PrismaClient } from '@server/generated/prisma/client'
import type { TransactionClient } from '@server/generated/prisma/internal/prismaNamespace'
import type {
  AuditCategory,
  AuditLogDetailResponse,
  AuditLogListItem,
  AuditLogPaginationRequest,
  AuditLogPaginationResponse,
  AuditModule,
} from '@server/src/modules/audit/audit.schema'
import { Prisma } from '@server/generated/prisma/client'
import { AuditCategory as PrismaAuditCategory } from '@server/generated/prisma/enums'
import { BusinessError } from '@server/src/common/exception'
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

class AuditService {
  async record(client: AuditClient, input: CreateAuditLogInput): Promise<void> {
    const context = getContext()

    if (!context) {
      throw new Error('Audit logging requires an active request context.')
    }

    const requestSnapshot = sanitizeAuditPayload(input.requestSnapshot)
    const operator = await this.resolveOperator(client, context, input.operator)

    await client.auditLog.create({
      data: {
        category: prismaAuditCategoryMap[input.category ?? 'operation'],
        module: input.module,
        action: input.action,
        operatorId: operator.operatorId,
        operatorUsername: operator.operatorUsername,
        operatorDisplayName: operator.operatorDisplayName ?? null,
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
    const { page, pageSize, search, categories, modules, sort } = query
    const skip = (page - 1) * pageSize

    const where = {
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
      ...(search
        ? {
            OR: [
              { module: { contains: search, mode: 'insensitive' as const } },
              { action: { contains: search, mode: 'insensitive' as const } },
              { operatorUsername: { contains: search, mode: 'insensitive' as const } },
              { operatorDisplayName: { contains: search, mode: 'insensitive' as const } },
              { path: { contains: search, mode: 'insensitive' as const } },
              { requestId: { contains: search, mode: 'insensitive' as const } },
              { ip: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const orderBy = buildOrderBy(
      sort,
      ['createdAt', 'category', 'module', 'action', 'operatorUsername'] as const,
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

  async getAuditLogById(id: string): Promise<AuditLogDetailResponse> {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    })

    if (!auditLog) {
      throw BusinessError.NotFound('Audit log not found')
    }

    return this.mapAuditLogDetail(auditLog)
  }

  private mapAuditLogListItem(auditLog: {
    id: string
    category: PrismaAuditCategory
    module: string
    action: string
    operatorId: string | null
    operatorUsername: string
    operatorDisplayName: string | null
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

    const { userId } = getLoginUser(context)
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
