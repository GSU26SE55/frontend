import type {
  AuditSeverity,
  AuditActionCategory,
} from "@/shared/enums/account/audit.enum";

export interface AuditAggregateDto {
  id: string;
  eventId: string;
  serviceName: string;
  actionCode: string;
  actionCategory: AuditActionCategory | string;
  severity: AuditSeverity | string;
  targetType: string | null;
  targetId: string | null;
  targetDisplay: string | null;
  actorAccountId: string | null;
  actorRole: string | null;
  actorDisplay: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  isSuccess: boolean;
  errorCode: string | null;
  reason: string | null;
  metadataJson: string | null;
  correlationId: string | null;
  causationId: string | null;
  occurredAt: string;
  recordedAt: string;
  geoCountry: string | null;
  geoCity: string | null;
}

export interface AuditSearchParams {
  service?: string;
  action?: string;
  category?: string;
  severity?: string;
  actorId?: string;
  targetId?: string;
  correlationId?: string;
  isSuccess?: boolean;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export type AuditExportParams = Omit<
  AuditSearchParams,
  "pageNumber" | "pageSize"
>;

export interface AuditStatsItemDto {
  key: string;
  count: number;
}

export interface AuditStatsParams {
  from?: string;
  to?: string;
  groupBy?: "severity" | "service" | "action";
}

export interface AuditReplayPayload {
  service?: string;
  from?: string;
  to?: string;
}

export interface AuditReplayJobDto {
  jobId: string;
  status:
    | "Requested"
    | "InProgress"
    | "Completed"
    | "CompletedWithErrors"
    | string;
  totalServices: number;
  completedServices: number;
  totalEventsReplayed: number;
  pendingServices: string[];
  requestedAt: string;
  completedAt: string | null;
  truncated?: boolean;
}

export interface AuditRedactPayload {
  accountId: string;
}
