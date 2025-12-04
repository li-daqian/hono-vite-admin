export const envConfig = {
  database: {
    url: process.env.DATABASE_URL ?? '',
    user: process.env.DATABASE_USER ?? '',
    password: process.env.DATABASE_PASSWORD ?? '',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  admin: {
    // Do not change env values after initial startup
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'admin@123!',
    roleName: process.env.ADMIN_ROLE_NAME ?? 'admin',
  },
}
