import type { RefreshTokenStatus } from "@/shared/enums/account.enum";
export { RefreshTokenStatus } from "@/shared/enums/account.enum";
export interface LoginPayload {
  email: string;
  password: string;
}

// FE form values — confirmPassword chỉ validate phía FE, KHÔNG gửi lên BE
export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

// API body — BE register KHÔNG nhận confirmPassword (api-auth.md §/register)
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
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

// ── GH-295: LoginResultDto — discriminated union (login, refresh, google, accept-invite) ──
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorChallengeDto {
  challengeToken: string; // 32 hex, TTL 5 phút (Redis)
  expiresInSeconds: number; // luôn 300
  methods: string[]; // luôn ["totp", "backupCode"]
}

// data của login/refresh/google/accept-invite. Case A: tokens set, challenge null.
// Case B (2FA on, chỉ login): tokens null, challenge set.
export interface LoginResultData {
  tokens: TokenDto | null;
  challenge: TwoFactorChallengeDto | null;
  requiresTwoFactor: boolean;
}

// Bước 2 của 2FA login (POST /api/auth/login/verify-2fa)
export interface Verify2faLoginPayload {
  challengeToken: string;
  code: string;
  isBackupCode: boolean;
}

// Key sessionStorage giữ challengeToken giữa /login → /login/2fa (TTL 5 phút server-side)
export const CHALLENGE_TOKEN_KEY = "login_2fa_challenge";

export interface VerifyResetOtpResponseData {
  resetToken: string;
  expiresInSeconds: number; // TTL resetToken (api-auth.md: 900s) — dùng động, không hardcode
}

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

export interface AcceptInviteFormValues {
  password: string;
  confirmPassword: string;
}

// BE validate cross-field password === confirmPassword → 422 (api-auth.md §/accept-invite)
export interface AcceptInvitePayload {
  invitationToken: string;
  password: string;
  confirmPassword: string;
}
