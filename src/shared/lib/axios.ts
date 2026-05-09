import axios from 'axios'
import Cookies from 'js-cookie'
import { env } from '@/config/env'

const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = Cookies.get('refreshToken')
      const { data } = await axios.post(`${env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
      const newToken: string = data.data.accessToken

      Cookies.set('accessToken', newToken)
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axiosInstance(originalRequest)
    } catch (err) {
      processQueue(err, null)
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
