import type { PrismaClient } from '@server/generated/prisma/client'
import type { TransactionClient } from '@server/generated/prisma/internal/prismaNamespace'
import type {
  AuditLogDetailResponse,
  AuditLogListItem,
  AuditLogPaginationRequest,
  AuditLogPaginationResponse,
  AuditModule,
} from '@server/src/modules/audit/audit.schema'
import { Prisma } from '@server/generated/prisma/client'
import { BusinessError } from '@server/src/common/exception'
import { prisma } from '@server/src/lib/prisma'
import { getLoginUser } from '@server/src/middleware/auth.middleware'
import { getContext } from '@server/src/middleware/context.middleware'
import { getRequestId } from '@server/src/middleware/requestId.middleware'
import { extractClientIp, sanitizeAuditPayload } from '@server/src/modules/audit/audit.utils'
import { buildOrderBy, paginate } from '@server/src/utils/pagination'

export interface CreateAuditLogInput {
  module: AuditModule
  action: string
  requestSnapshot?: unknown
}

type AuditClient = PrismaClient | TransactionClient

class AuditService {
  async record(client: AuditClient, input: CreateAuditLogInput): Promise<void> {
    const context = getContext()

    if (!context) {
      throw new Error('Audit logging requires an active request context.')
    }

    const { userId } = getLoginUser(context)
    const requestSnapshot = sanitizeAuditPayload(input.requestSnapshot)
    const operator = await client.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
      },
    })

    await client.auditLog.create({
      data: {
        module: input.module,
        action: input.action,
        operatorId: userId,
        operatorUsername: operator?.username ?? userId,
        operatorDisplayName: operator?.displayName ?? null,
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
    const { page, pageSize, search, modules, sort } = query
    const skip = (page - 1) * pageSize

    const where = {
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
      ['createdAt', 'module', 'action', 'operatorUsername'] as const,
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
    module: string
    action: string
    operatorId: string
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
    module: string
    action: string
    operatorId: string
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
}

export const auditService = new AuditService()
