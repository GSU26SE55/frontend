// Battery & Alert audit log (BatteryService fallback) — docs/api-battery.md §Audit (2739-2794).
// severity/actionCategory: DISPLAY-only (renders a colored badge); NOT a filter param.
export type {
  AuditSeverity,
  AuditActionCategory,
} from "@/shared/enums/account/audit.enum";

export interface BatteryAuditLogDto {
  id: string;
  eventId: string; // idempotency key
  actionCode: string;
  actionCategory: string; // see AuditActionCategory
  severity: string; // see AuditSeverity
  targetId: string | null;
  targetDisplay: string | null; // null / [REDACTED] after GDPR
  actorAccountId: string | null; // null if system
  isSuccess: boolean;
  reason: string | null;
  occurredAt: string; // ISO UTC
}

// Filter param BatteryService: only action / target / date / page (NO severity/category).
export interface BatteryAuditLogParams {
  action?: string;
  batteryId?: string;
  from?: string; // UTC
  to?: string; // UTC
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number; // default 1
  pageSize?: number; // default 50, ≤ 100
}

export interface AlertAuditLogParams {
  action?: string;
  alertId?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}
