const LOCAL_API_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

function shouldUseDevProxy(apiBaseUrl: string | undefined): boolean {
  if (!import.meta.env.DEV) {
    return false
  }

  if (!apiBaseUrl) {
    return true
  }

  try {
    return LOCAL_API_HOSTNAMES.has(new URL(apiBaseUrl).hostname)
  }
  catch {
    return false
  }
}

export function getEnv() {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL

  return {
    apiBaseUrl: shouldUseDevProxy(configuredApiBaseUrl) ? '' : configuredApiBaseUrl ?? '',
  }
}
