import { create } from 'zustand'

export interface AuthUser {
  userId: string
  fullName: string
  email: string
  role: '1' | '2' | '3' | '4'
}

interface SessionState {
  user: AuthUser | null
  accessToken: string | null
  setSession: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
}))
