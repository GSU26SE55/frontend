export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Customer'

export type AuthUser = {
  id?: string
  email?: string
  name?: string
  role: UserRole
}

export type AuthSession = {
  accessToken: string
  refreshToken?: string | null
  user: AuthUser
}
