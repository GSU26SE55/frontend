import axios from 'axios'

import { env } from '@/config/env'
import { useSessionStore } from '@/shared/stores/sessionStore'

export const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const token = useSessionStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSessionStore.getState().clearSession()
    }

    return Promise.reject(error)
  },
)
