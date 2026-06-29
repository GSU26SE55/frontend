import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  AuditAggregateDto,
  AuditStatsItemDto,
  AuditSearchParams,
  AuditReplayParams,
  AuditRedactParams,
} from "@/shared/types/audit-aggregate.types";

export const auditAggregatorService = {
  search: (params?: AuditSearchParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AuditAggregateDto>>>(
      ENDPOINTS.AUDIT_AGGREGATOR.SEARCH,
      { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto>>(
      ENDPOINTS.AUDIT_AGGREGATOR.DETAIL(id),
    ),

  getByCorrelation: (corrId: string) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.CORRELATION(corrId),
    ),

  getAccountTimeline: (accountId: string, limit?: number) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.ACCOUNT_TIMELINE(accountId),
      { params: limit != null ? { limit } : undefined },
    ),

  getStats: (params?: object) =>
    axiosInstance.get<CommonResponse<AuditStatsItemDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.STATS,
      { params },
    ),

  export: (params?: object, format: "csv" | "xlsx" = "csv") =>
    axiosInstance.get<Blob>(ENDPOINTS.AUDIT_AGGREGATOR.EXPORT, {
      params: { ...params, format },
      responseType: "blob",
    }),

  replay: (payload: AuditReplayParams) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.AUDIT_AGGREGATOR.REPLAY,
      payload,
    ),

  redact: (payload: AuditRedactParams) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.AUDIT_AGGREGATOR.REDACT,
      payload,
    ),
};
