export function getEnv() {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    domain: process.env.DOMAIN!,

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
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      accessTokenExpiry: process.env.TOKEN_EXPIRY!,
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY!,
    },
  }
}
