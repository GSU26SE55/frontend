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

export const LoginAttemptResult = {
  Success: 1,
  WrongPassword: 2,
  AccountNotFound: 3,
  AccountLocked: 4,
  AccountSuspended: 5,
  AccountBanned: 6,
  AccountInactive: 7,
  AccountNotVerified: 8,
} as const;
export type LoginAttemptResult =
  (typeof LoginAttemptResult)[keyof typeof LoginAttemptResult];

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

// PendingVerification = 0 is an intentional exception — mirrors the BE API contract
export const AccountStatusEnum = {
  PendingVerification: 0,
  Active: 1,
  Locked: 2,
  Inactive: 3,
  Suspended: 4,
  Banned: 5,
} as const;
export type AccountStatusEnum =
  (typeof AccountStatusEnum)[keyof typeof AccountStatusEnum];
