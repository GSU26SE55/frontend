import type { LoginAttemptResult } from "@/shared/enums/account/audit.enum";
import type { PaginationResponse } from "@/shared/types/api.types";
export { LoginAttemptResult } from "@/shared/enums/account/audit.enum";
export { AccountStatusEnum } from "@/shared/enums/account/account.enum";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailPayload {
  newEmail: string;
  currentPassword: string;
}

export interface ConfirmEmailChangePayload {
  otp: string;
}

export interface VerifyPhoneOtpPayload {
  otp: string;
}

// ── GH-295: two-step 2FA enroll flow ──
// Step 1 — POST /api/accounts/me/2fa/init (NOT activated yet)
export interface Init2faResponseData {
  secret: string; // base32 — the user types it manually if they do not scan the QR
  otpAuthUri: string; // otpauth://... — render QR
  pendingToken: string; // sent along with the confirm step
}

// Step 2 — POST /api/accounts/me/2fa/confirm
export interface Confirm2faPayload {
  pendingToken: string;
  code: string; // 6-digit TOTP
}
export interface Confirm2faResponseData {
  enabled: boolean;
  backupCodes: string[]; // 8 codes — shown only once
}

// POST /api/accounts/me/2fa/disable — re-auth with password + TOTP
export interface Disable2faPayload {
  password: string;
  totpCode: string;
}

// POST /api/accounts/me/2fa/backup-codes/regenerate
export interface RegenBackupCodesPayload {
  totpCode: string;
}
export interface RegenBackupCodesResponseData {
  backupCodes: string[];
}

export interface LinkGooglePayload {
  idToken: string;
}

// ── #AUTH-51: Cross-device 2FA setup ──
// Step 1 — POST /api/auth/2fa/cross-device-confirm/request (Device A, empty body)
export interface CrossDeviceRequestResponseData {
  confirmToken: string; // 64 hex — the FE only displays/debugs it, Device B reads it from the email link
  expiresInSeconds: number; // always 600 (10 minutes) — countdown
  otpAuthUri: string; // otpauth://... — render the QR for Device B to scan
  secret: string; // base32 — manual-entry fallback if the QR is not scanned
}

// Step 2 — POST /api/auth/2fa/cross-device-confirm (Device B)
export interface CrossDeviceConfirmPayload {
  confirmToken: string; // 64 hex from the email link query param
  totpCode: string; // 6-digit TOTP from the Authenticator
}

// ── #AUTH-62: GDPR Article 20 — GET /api/accounts/me/export ──
// Shape matches the BE AccountDataExportDto (ExportMyDataQuery.cs).
export interface AccountSnapshot {
  id: string;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  twoFactorEnabled: boolean;
  status: string;
  googleId?: string | null;
  provider?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  role: string;
  createdAt: string;
}

export interface AccountProfileSnapshot {
  externalAvatarUrl?: string | null;
  avatarSource?: string | null;
  address?: string | null;
  birthDate?: string | null;
  timeZone?: string | null;
}

export interface StaffProfileSnapshot {
  employeeCode?: string | null;
  department?: string | null;
  skillTier?: string | null;
  notes?: string | null;
}

export interface SessionSnapshot {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

export interface AuditLogSnapshot {
  id: string;
  action: string;
  occurredAt: string;
  isSuccess: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}

export interface BackupCodeSnapshot {
  id: string;
  createdAt: string;
  redeemedAt?: string | null;
}

export interface AccountDataExportDto {
  account: AccountSnapshot;
  profile?: AccountProfileSnapshot | null;
  staffProfile?: StaffProfileSnapshot | null;
  sessions: SessionSnapshot[];
  auditLogs: AuditLogSnapshot[];
  backupCodes: BackupCodeSnapshot[];
  exportedAt: string;
  format: string; // "json"
  version: string; // "1.0"
}

export interface LoginHistoryParams {
  pageNumber?: number;
  pageSize?: number;
  result?: LoginAttemptResult;
  onlyFailed?: boolean;
  fromUtc?: string;
  toUtc?: string;
  sortBy?: string;
  sortDir?: string;
}

// LoginAttemptDto is shared — the real source lives in shared.
import type { LoginAttemptDto } from "@/shared/types/ticket/login-attempt.types";
export type { LoginAttemptDto } from "@/shared/types/ticket/login-attempt.types";

// = PaginationResponse<LoginAttemptDto> — use the generic instead of hand-writing it.
export type LoginHistoryResponseData = PaginationResponse<LoginAttemptDto>;
