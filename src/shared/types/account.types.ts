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

export interface AccountProfileDto {
  accountId: string;
  avatarFileId?: string;
  externalAvatarUrl?: string;
  avatarSource: AvatarSourceEnum;
  address?: string;
  birthDate?: string;
  timeZone?: string;
}

export interface StaffSkillDto {
  skillCode: string;
  skillLevel: number;
  certifiedUntil?: string;
}

export interface StaffProfileDto {
  accountId: string;
  employeeCode: string;
  department: string;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  notes?: string;
  skills: StaffSkillDto[];
}

export interface AccountDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  /** @deprecated render avatar via profile?.avatarFileId / externalAvatarUrl by avatarSource */
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  twoFactorEnabled: boolean;
  status: AccountStatusEnum;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roleId: string;
  role: string;
  roleAssignedAt?: string;
  roleAssignedBy?: string;
  profile?: AccountProfileDto;
  staffProfile?: StaffProfileDto;
}

// Cross-feature: used by admin (Nhóm 6) + auth (GET /api/staff in GH-28)
export interface StaffAssignmentProfileDto {
  accountId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  department?: string;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  displayAvatarUrl?: string;
  skills: StaffSkillDto[];
}
