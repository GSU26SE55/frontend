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

export interface EnableTwoFactorResponseData {
  secret: string;
  otpAuthUri: string;
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
