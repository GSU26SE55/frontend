import type { LoginAttemptResult } from "@/shared/enums/account/audit.enum";

// LoginAttemptDto — dùng chung admin (audit) + auth (login history).
// Nullable field dùng `?: T | null` (superset): khớp BE trả null, đồng thời
// tương thích call-site cũ của admin (trước dùng optional `?:`).
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
