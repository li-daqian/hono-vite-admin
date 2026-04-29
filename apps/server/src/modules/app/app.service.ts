import type {
  AppConfigResponse,
  AppSecurityPolicyResponse,
  AppSecurityPolicyUpdateRequest,
} from '@server/src/modules/app/app.schema'
import { BusinessError } from '@server/src/common/exception'
import { getEnv } from '@server/src/lib/env'
import { prisma } from '@server/src/lib/prisma'
import { LoginLockDurationValueSchema } from '@server/src/modules/app/app.schema'
import { auditService } from '@server/src/modules/audit/audit.service'

export const APP_READ_ONLY_MESSAGE = 'Demo read-only'

export const SECURITY_POLICY_CONFIG_KEYS = {
  maxFailedLoginAttempts: 'LOGIN_MAX_FAILED_ATTEMPTS',
  loginLockDuration: 'LOGIN_LOCK_DURATION',
} as const

const SECURITY_POLICY_KEYS = Object.values(SECURITY_POLICY_CONFIG_KEYS)

type LoginSecurityPolicy = Pick<AppSecurityPolicyResponse, 'maxFailedLoginAttempts' | 'loginLockDuration'>

function parseMaxFailedLoginAttempts(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function parseLoginLockDuration(value: string | undefined, fallback: string): string {
  return LoginLockDurationValueSchema.safeParse(value).success ? value! : fallback
}

function isSecurityPolicyEditable(): boolean {
  const env = getEnv()
  return !env.isProduction && !env.deployment.readOnlyMode
}

async function getStoredSecurityPolicyValues(): Promise<Map<string, string>> {
  const configs = await prisma.sysConfig.findMany({
    where: {
      key: {
        in: SECURITY_POLICY_KEYS,
      },
    },
  })

  return new Map(configs.map(config => [config.key, config.value]))
}

export const appService = {
  getConfig(): AppConfigResponse {
    return {
      readOnlyMode: getEnv().deployment.readOnlyMode,
      readOnlyMessage: APP_READ_ONLY_MESSAGE,
    }
  },

  async getLoginSecurityPolicy(): Promise<LoginSecurityPolicy> {
    const env = getEnv()
    const storedValues = await getStoredSecurityPolicyValues()

    return {
      maxFailedLoginAttempts: parseMaxFailedLoginAttempts(
        storedValues.get(SECURITY_POLICY_CONFIG_KEYS.maxFailedLoginAttempts),
        env.auth.maxFailedLoginAttempts,
      ),
      loginLockDuration: parseLoginLockDuration(
        storedValues.get(SECURITY_POLICY_CONFIG_KEYS.loginLockDuration),
        env.auth.loginLockDuration,
      ),
    }
  },

  async getSecurityPolicy(): Promise<AppSecurityPolicyResponse> {
    return {
      ...(await this.getLoginSecurityPolicy()),
      editable: isSecurityPolicyEditable(),
    }
  },

  async updateSecurityPolicy(request: AppSecurityPolicyUpdateRequest): Promise<AppSecurityPolicyResponse> {
    if (!isSecurityPolicyEditable()) {
      throw BusinessError.Forbidden('Security policy can only be changed in local development.', 'SecurityPolicyReadOnly')
    }

    const previous = await this.getLoginSecurityPolicy()

    await prisma.$transaction(async (tx) => {
      await tx.sysConfig.upsert({
        where: { key: SECURITY_POLICY_CONFIG_KEYS.maxFailedLoginAttempts },
        update: { value: String(request.maxFailedLoginAttempts) },
        create: {
          key: SECURITY_POLICY_CONFIG_KEYS.maxFailedLoginAttempts,
          value: String(request.maxFailedLoginAttempts),
        },
      })

      await tx.sysConfig.upsert({
        where: { key: SECURITY_POLICY_CONFIG_KEYS.loginLockDuration },
        update: { value: request.loginLockDuration },
        create: {
          key: SECURITY_POLICY_CONFIG_KEYS.loginLockDuration,
          value: request.loginLockDuration,
        },
      })

      await auditService.record(tx, {
        module: 'auth',
        action: 'update-security-policy',
        requestSnapshot: {
          previous,
          next: {
            maxFailedLoginAttempts: request.maxFailedLoginAttempts,
            loginLockDuration: request.loginLockDuration,
          },
        },
      })
    })

    return this.getSecurityPolicy()
  },
}
