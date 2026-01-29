import type { ErrorResponse } from '@admin/client'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { postAuthRefresh } from '@admin/client'
import { client } from '@admin/client/client.gen'
import { AuthManager } from '@admin/lib/auth'
import { getEnv } from '@admin/lib/env'
import { useAuthStore } from '@admin/stores/auth'
import axios from 'axios'
import { toast } from 'vue-sonner'

const refreshAccessToken = (() => {
  let refreshPromise: Promise<void> | null = null

  return async function (): Promise<void> {
    return refreshPromise ||= (async () => {
      try {
        const response = await postAuthRefresh<true>({
          body: { refreshToken: null },
        })
        useAuthStore().setAccessToken(response.data.accessToken)
      }
      finally {
        refreshPromise = null
      }
    })()
  }
})()

const logoutAndRedirect = (() => {
  let logoutPromise: Promise<void> | null = null

  return async function (): Promise<void> {
    return logoutPromise ||= AuthManager.logout(true)
  }
})()

/**
 * Setup custom axios interceptors for the generated API client.
 * This allows us to add request/response handling without modifying generated code.
 */
function setupAxiosInterceptors() {
  const axiosInstance = client.instance

  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add Authorization header if access token is available
      const authStore = useAuthStore()
      const accessToken = authStore.accessToken
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }

      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    },
  )

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    async (error: AxiosError) => {
      const { response, config } = error

      // Handle 401 Unauthorized - token refresh logic
      if (response?.status === 401) {
        if (!config) {
          await logoutAndRedirect()
          return Promise.reject(error)
        }
        if (config.url?.includes('/api/v1/auth/refresh')) {
          // Refresh token request itself failed, force logout
          await logoutAndRedirect()
          return Promise.reject(error)
        }

        await refreshAccessToken()
        return axiosInstance.request(config)
      }
      else {
        if (axios.isAxiosError<ErrorResponse>(error)) {
          toast.error(error.response?.data.message ?? 'An unknown error occurred')
        }
        else {
          toast.error(error.message ?? 'An unknown error occurred')
        }
      }

      return Promise.reject(error)
    },
  )
}

export function setupAxios() {
  const apiBaseURL = `${getEnv().apiBaseUrl}/api/v1`
  client.setConfig({
    baseURL: apiBaseURL,
    withCredentials: true,
    throwOnError: true,
  })

  setupAxiosInterceptors()
}
