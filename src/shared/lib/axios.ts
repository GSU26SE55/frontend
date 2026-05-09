import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import Cookies from 'js-cookie'
import { env } from '@/config/env'
import { useSessionStore } from '@/shared/stores/sessionStore'

export const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processPendingQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err || !token) reject(err)
    else resolve(token)
  })
  pendingQueue = []
}

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useSessionStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError & { config: InternalAxiosRequestConfig & { _retry?: boolean } }) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = Cookies.get('refreshtoken')
      const { data } = await axios.post(`${env.VITE_API_BASE_URL}/api/auth/refresh`, { refreshToken })
      const newToken: string = data.data.accessToken

      Cookies.set('accesstoken', newToken, { expires: 1 / 24 })
      useSessionStore.getState().setToken(newToken, useSessionStore.getState().user!)

      processPendingQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processPendingQueue(refreshError, null)
      Cookies.remove('accesstoken')
      Cookies.remove('refreshtoken')
      useSessionStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
