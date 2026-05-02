import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useCallback, useEffect, type ReactNode } from 'react'

import { AuthContext } from '@/shared/context/authContextValue'
import { useSessionStore } from '@/shared/stores/sessionStore'
import type { AuthUser, UserRole } from '@/shared/types/auth.types'

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'

type JwtPayload = {
  exp?: number
  sub?: string
  email?: string
  name?: string
  role?: string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
}

function toUserRole(role?: string): UserRole | null {
  if (role === 'Admin' || role === 'Manager' || role === 'Staff' || role === 'Customer') {
    return role
  }

  return null
}

function buildUserFromToken(token: string): AuthUser | null {
  const payload = jwtDecode<JwtPayload>(token)
  const expiresAt = payload.exp ? payload.exp * 1000 : null

  if (expiresAt && expiresAt <= Date.now()) {
    return null
  }

  const role = toUserRole(
    payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  )

  if (!role) {
    return null
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useSessionStore((state) => state.setSession)
  const clearSession = useSessionStore((state) => state.clearSession)
  const setHydrated = useSessionStore((state) => state.setHydrated)

  const logout = useCallback(() => {
    Cookies.remove(ACCESS_TOKEN_COOKIE)
    Cookies.remove(REFRESH_TOKEN_COOKIE)
    clearSession()
  }, [clearSession])

  useEffect(() => {
    const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE)
    const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) ?? null

    if (accessToken) {
      try {
        const user = buildUserFromToken(accessToken)

        if (user) {
          setSession({ accessToken, refreshToken, user })
        } else {
          logout()
        }
      } catch {
        logout()
      }
    }

    setHydrated(true)
  }, [logout, setHydrated, setSession])

  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
}
