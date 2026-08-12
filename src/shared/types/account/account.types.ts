import type { AvatarSourceEnum } from "@/shared/enums/account/account.enum";
export {
  AccountStatusEnum,
  AvatarSourceEnum,
  RefreshTokenStatus,
} from "@/shared/enums/account/account.enum";
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
  skillTier: number; // StaffSkillTierEnum 1–3 (api-auth.md §Group 6)
  notes?: string;
  skills: StaffSkillDto[] | null; // Swagger: nullable — guard with `skills ?? []` when rendering
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
  /** GH-132 (F) — whether the account is linked to Google (the BE does not
   * expose googleId). */
  isGoogleLinked?: boolean;
  status: import("@/shared/enums/account/account.enum").AccountStatusEnum;
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

// Cross-feature: used by admin (Group 6) + auth (GET /api/staff in GH-28)
export interface StaffAssignmentProfileDto {
  accountId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  department?: string;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  displayAvatarUrl?: string;
  /**
   * Skill tier (StaffSkillTierEnum 1..3) — decides whether a staff member can
   * be the PrimaryHandler of a ticket at a given priority.
   *
   * ⚠️ OPTIONAL because `GET /api/staff` does NOT return this field yet: the
   * BE has `StaffProfile.SkillTier` in the entity/DB but `AccountProfileMapper`
   * does not map it onto `StaffAssignmentProfileDto`. Every reader of this
   * field must fall back safely (do not block the Manager when undefined) —
   * see `shared/utils/ticket/staffTier.ts`. Once the BE maps the field, the UI
   * fills in on its own.
   */
  skillTier?: number;
  skills: StaffSkillDto[];
}
