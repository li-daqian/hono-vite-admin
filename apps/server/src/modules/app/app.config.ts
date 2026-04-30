export const APP_READ_ONLY_MESSAGE = 'Demo read-only'

export const APP_CONFIG_KEYS = {
  siteName: 'APP_SITE_NAME',
  loginTitle: 'APP_LOGIN_TITLE',
  defaultPageSize: 'APP_DEFAULT_PAGE_SIZE',
} as const

export const APP_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const

export const APP_CONFIG_DEFAULTS = {
  siteName: 'User Admin',
  loginTitle: 'Sign in to Admin',
  defaultPageSize: 10,
} as const
