import { create } from 'zustand'

import type { AuthSession, AuthUser } from '@/shared/types/auth.types'

type SessionState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isHydrated: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  setHydrated: (isHydrated: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  setSession: ({ accessToken, refreshToken = null, user }) =>
    set({ accessToken, refreshToken, user }),
  clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}))
