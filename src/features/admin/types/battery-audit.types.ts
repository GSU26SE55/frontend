// Audit log Pin & Cảnh báo (BatteryService fallback) — docs/api-battery.md §Audit (2739-2794).
// severity/actionCategory: DISPLAY-only (render badge màu); KHÔNG phải filter param.
export type {
  AuditSeverity,
  AuditActionCategory,
} from "@/shared/enums/audit.enum";

export interface BatteryAuditLogDto {
  id: string;
  eventId: string; // idempotency key
  actionCode: string;
  actionCategory: string; // xem AuditActionCategory
  severity: string; // xem AuditSeverity
  targetId: string | null;
  targetDisplay: string | null; // null / [REDACTED] sau GDPR
  actorAccountId: string | null; // null nếu hệ thống
  isSuccess: boolean;
  reason: string | null;
  occurredAt: string; // ISO UTC
}

// Filter param BatteryService: chỉ action / target / date / page (KHÔNG có severity/category).
export interface BatteryAuditLogParams {
  action?: string;
  batteryId?: string;
  from?: string; // UTC
  to?: string; // UTC
  pageNumber?: number; // default 1
  pageSize?: number; // default 50, ≤ 100
}

export interface AlertAuditLogParams {
  action?: string;
  alertId?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}
