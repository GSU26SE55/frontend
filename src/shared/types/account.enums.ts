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

export const AvatarSourceEnum = {
  None: 0,
  Uploaded: 1,
  Google: 2,
} as const;
export type AvatarSourceEnum =
  (typeof AvatarSourceEnum)[keyof typeof AvatarSourceEnum];

export const RefreshTokenStatus = {
  Active: 1,
  Used: 2,
  Revoked: 3,
  Expired: 4,
  Compromised: 5,
} as const;
export type RefreshTokenStatus =
  (typeof RefreshTokenStatus)[keyof typeof RefreshTokenStatus];

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
