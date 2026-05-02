import { createContext } from 'react'

export type AuthContextValue = {
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
