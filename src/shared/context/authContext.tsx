import { createContext, useEffect, type ReactNode } from 'react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useSessionStore, type AuthUser } from '@/shared/stores/sessionStore'

interface JwtPayload {
  UserId: string
  FullName: string
  Email: string
  Role: '1' | '2' | '3' | '4'
  exp: number
}

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useSessionStore((s) => s.setSession)
  const logout = useSessionStore((s) => s.logout)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) return

    try {
      const payload = jwtDecode<JwtPayload>(token)
      if (payload.exp * 1000 < Date.now()) {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        logout()
        return
      }
      const user: AuthUser = {
        userId: payload.UserId,
        fullName: payload.FullName,
        email: payload.Email,
        role: payload.Role,
      }
      setSession(user, token)
    } catch {
      logout()
    }
  }, [setSession, logout])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
