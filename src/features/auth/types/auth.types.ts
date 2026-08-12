export { RefreshTokenStatus } from "@/shared/enums/account/account.enum";
export interface LoginPayload {
  email: string;
  password: string;
}

// FE form values — confirmPassword is validated on the FE only, it is NOT sent to the BE
export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

// API body — the BE register endpoint does NOT accept confirmPassword (api-auth.md §/register)
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
  challengeToken: string; // 32 hex, TTL 5 minutes (Redis)
  expiresInSeconds: number; // always 300
  methods: string[]; // always ["totp", "backupCode"]
}

// data of login/refresh/google/accept-invite. Case A: tokens set, challenge null.
// Case B (2FA on, login only): tokens null, challenge set.
export interface LoginResultData {
  tokens: TokenDto | null;
  challenge: TwoFactorChallengeDto | null;
  requiresTwoFactor: boolean;
}

// Step 2 of the 2FA login (POST /api/auth/login/verify-2fa)
// Matches the BE Verify2FALoginCommand: isSmsCode (#AUTH-58) is mutually exclusive with isBackupCode;
// trustDevice + trustDeviceLabel (#AUTH-48) apply to the TOTP/SMS path only.
export interface Verify2faLoginPayload {
  challengeToken: string;
  code: string;
  isBackupCode: boolean;
  isSmsCode?: boolean; // true ⇒ the code is an OTP received over SMS (fallback)
  trustDevice?: boolean; // true ⇒ skip 2FA from this device for 30 days
  trustDeviceLabel?: string; // friendly label (max 120), optional
}

// #AUTH-58: POST /api/auth/login/2fa/sms — send the SMS OTP fallback (X-Challenge-Token header)
export interface Sms2faPayload {
  challengeToken: string;
}

// #AUTH-50: restore a soft-deleted account (90-day window)
export interface ReactivateRequestPayload {
  email: string;
}
export interface ReactivateVerifyPayload {
  email: string;
  otp: string;
}

// sessionStorage key holding the challengeToken between /login → /login/2fa (server-side TTL 5 minutes)
export const CHALLENGE_TOKEN_KEY = "login_2fa_challenge";

export interface VerifyResetOtpResponseData {
  resetToken: string;
  expiresInSeconds: number; // resetToken TTL (api-auth.md: 900s) — use it dynamically, do not hardcode
}

// SessionDto is shared — the real source lives in shared.
export type { SessionDto } from "@/shared/types/account/session.types";

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

// The BE cross-field validates password === confirmPassword → 422 (api-auth.md §/accept-invite)
export interface AcceptInvitePayload {
  invitationToken: string;
  password: string;
  confirmPassword: string;
}
