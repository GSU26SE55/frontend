import { create } from 'zustand'
import type { UserRole } from '@/shared/types/common.types'

interface AuthUser {
  userId: string
  fullName: string
  email: string
  role: UserRole
}

interface SessionState {
  accessToken: string | null
  user: AuthUser | null
  setToken: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  setToken: (accessToken, user) => set({ accessToken, user }),
  logout: () => set({ accessToken: null, user: null }),
}))
