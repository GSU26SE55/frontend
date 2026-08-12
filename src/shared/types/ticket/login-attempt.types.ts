import type { LoginAttemptResult } from "@/shared/enums/account/audit.enum";

// LoginAttemptDto — shared by admin (audit) and auth (login history).
// Nullable fields use `?: T | null` (a superset): it matches the null the BE
// returns while staying compatible with admin's existing call sites, which
// previously relied on plain optional `?:`.
export interface LoginAttemptDto {
  id: string;
  accountId?: string | null;
  attemptedEmail: string;
  result: LoginAttemptResult;
  resultName: string;
  method: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  note?: string | null;
  createdAt: string;
}
