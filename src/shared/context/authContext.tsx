import { createContext, useContext, useEffect, type ReactNode } from 'react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useSessionStore } from '@/shared/stores/sessionStore'
import type { UserRole } from '@/shared/types/common.types'

interface JwtPayload {
  UserId: string
  FullName: string
  email: string
  Role: string
  exp: number
}

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setToken, logout } = useSessionStore()

  useEffect(() => {
    const token = Cookies.get('accesstoken')
    if (!token) return

    try {
      const payload = jwtDecode<JwtPayload>(token)
      const isExpired = payload.exp * 1000 < Date.now()
      if (isExpired) {
        logout()
        return
      }

      const roleMap: Record<string, UserRole> = { '1': 'Admin', '2': 'Manager', '3': 'Staff' }
      setToken(token, {
        userId: payload.UserId,
        fullName: payload.FullName,
        email: payload.email,
        role: roleMap[payload.Role] ?? 'Staff',
      })
    } catch {
      logout()
    }
  }, [setToken, logout])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  useContext(AuthContext)
  return useSessionStore()
}
