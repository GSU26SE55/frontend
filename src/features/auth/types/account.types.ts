import type { LoginAttemptResult } from "@/features/admin/enums/audit.enum";
export { LoginAttemptResult } from "@/features/admin/enums/audit.enum";
export { AccountStatusEnum } from "@/shared/enums/account.enum";

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

// ── GH-295: 2FA enroll flow 2 bước ──
// Bước 1 — POST /api/accounts/me/2fa/init (CHƯA activate)
export interface Init2faResponseData {
  secret: string; // base32 — user nhập tay nếu không quét QR
  otpAuthUri: string; // otpauth://... — render QR
  pendingToken: string; // gửi kèm bước confirm
}

// Bước 2 — POST /api/accounts/me/2fa/confirm
export interface Confirm2faPayload {
  pendingToken: string;
  code: string; // TOTP 6 số
}
export interface Confirm2faResponseData {
  enabled: boolean;
  backupCodes: string[]; // 8 codes — hiển thị 1 lần duy nhất
}

// POST /api/accounts/me/2fa/disable — re-auth bằng password + TOTP
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
// Bước 1 — POST /api/auth/2fa/cross-device-confirm/request (Device A, body rỗng)
export interface CrossDeviceRequestResponseData {
  confirmToken: string; // 64 hex — FE chỉ hiển thị/debug, Device B đọc từ email link
  expiresInSeconds: number; // luôn 600 (10 phút) — countdown
  otpAuthUri: string; // otpauth://... — render QR cho Device B scan
  secret: string; // base32 — fallback nhập tay nếu không scan QR
}

// Bước 2 — POST /api/auth/2fa/cross-device-confirm (Device B)
export interface CrossDeviceConfirmPayload {
  confirmToken: string; // 64 hex từ query param email link
  totpCode: string; // TOTP 6 số từ Authenticator
}

// ── #AUTH-62: GDPR Article 20 — GET /api/accounts/me/export ──
// Shape khớp BE AccountDataExportDto (ExportMyDataQuery.cs).
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
}

export interface LoginAttemptDto {
  id: string;
  accountId: string | null;
  attemptedEmail: string;
  result: LoginAttemptResult;
  resultName: string;
  method: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface LoginHistoryResponseData {
  items: LoginAttemptDto[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
