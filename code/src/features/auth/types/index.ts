export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  userId: string
  fullName: string
  email: string
  role: 'Admin' | 'Manager' | 'Staff'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
