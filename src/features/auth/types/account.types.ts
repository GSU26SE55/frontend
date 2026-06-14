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
