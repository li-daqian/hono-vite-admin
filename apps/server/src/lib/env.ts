function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function getEnv() {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    frontendDomain: process.env.FRONTEND_DOMAIN!,
    deployment: {
      readOnlyMode: parseBooleanEnv(process.env.READ_ONLY_MODE),
    },

    database: {
      url: process.env.DATABASE_URL!,
    },
    log: {
      level: process.env.LOG_LEVEL!,
    },
    admin: {
      // Do not change env values after initial startup
      username: process.env.ADMIN_USERNAME!,
      password: process.env.ADMIN_PASSWORD!,
      roleName: process.env.ADMIN_ROLE_NAME!,
      email: process.env.ADMIN_EMAIL!,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      accessTokenExpiry: process.env.TOKEN_EXPIRY!,
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY!,
    },
  }
}
