export interface AuditAggregateDto {
  id: string;
  correlationId: string;
  accountId: string;
  accountEmail: string;
  service: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  requestBody: string | null;
  responseCode: number;
  occurredAt: string;
}

export interface AuditStatsItemDto {
  key: string;
  count: number;
}

export interface AuditSearchParams {
  accountId?: string;
  service?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AuditReplayParams {
  eventId: string;
  targetService?: string;
}

export interface AuditRedactParams {
  accountId: string;
  reason: string;
}
