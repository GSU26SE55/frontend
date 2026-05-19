export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyResetOtpResponseData {
  resetToken: string;
}

export const RefreshTokenStatus = {
  Active:      1,
  Used:        2,
  Revoked:     3,
  Expired:     4,
  Compromised: 5,
} as const;
export type RefreshTokenStatus = typeof RefreshTokenStatus[keyof typeof RefreshTokenStatus];

export interface SessionDto {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: RefreshTokenStatus;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  revokedAt?: string;
  revokedReason?: string;
  isCurrent: boolean;
}

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  timeZone?: string;
}

export interface UpdateAvatarPayload {
  avatarFileId: string;
}

export interface RevokeAllSessionsPayload {
  exceptCurrent?: boolean;
  currentRefreshToken?: string;
}
