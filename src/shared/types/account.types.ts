import type { AvatarSourceEnum } from "@/shared/enums/account.enum";
export {
  AccountStatusEnum,
  AvatarSourceEnum,
  RefreshTokenStatus,
} from "@/shared/enums/account.enum";
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
  employeeCode?: string; // Swagger: nullable
  department?: string; // Swagger: nullable
  maxConcurrentTickets: number;
  isAvailable: boolean;
  skillTier: number; // StaffSkillTierEnum 1–3 (api-auth.md §Nhóm 6)
  notes?: string;
  skills: StaffSkillDto[] | null; // Swagger: nullable — guard bằng `skills ?? []` khi render
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
  status: import("@/shared/enums/account.enum").AccountStatusEnum;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roleId: string;
  role: string;
  roleAssignedAt?: string;
  roleAssignedBy?: string;
  profile?: AccountProfileDto;
  staffProfile?: StaffProfileDto;
  displayAvatarUrl?: string;
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
