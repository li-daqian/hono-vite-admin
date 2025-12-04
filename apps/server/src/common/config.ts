export const envConfig = {
  database: {
    url: process.env.DATABASE_URL ?? '',
    user: process.env.DATABASE_USER ?? '',
    password: process.env.DATABASE_PASSWORD ?? '',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
}
