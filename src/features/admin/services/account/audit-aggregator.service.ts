import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  AuditAggregateDto,
  AuditSearchParams,
  AuditExportParams,
  AuditStatsItemDto,
  AuditStatsParams,
  AuditReplayPayload,
  AuditReplayJobDto,
} from "@/features/admin/types/account/audit-aggregator.types";

export const auditAggregatorService = {
  search: (params?: AuditSearchParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AuditAggregateDto>>>(
      ENDPOINTS.AUDIT_AGGREGATOR.SEARCH,
      { params },
    ),

  getById: (eventId: string) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto>>(
      ENDPOINTS.AUDIT_AGGREGATOR.DETAIL(eventId),
    ),

  getByCorrelation: (correlationId: string) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.CORRELATION(correlationId),
    ),

  getAccountTimeline: (accountId: string, limit = 100) =>
    axiosInstance.get<CommonResponse<AuditAggregateDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.ACCOUNT_TIMELINE(accountId),
      { params: { limit } },
    ),

  getStats: (params?: AuditStatsParams) =>
    axiosInstance.get<CommonResponse<AuditStatsItemDto[]>>(
      ENDPOINTS.AUDIT_AGGREGATOR.STATS,
      { params },
    ),

  export: async (
    params?: AuditExportParams,
    format: "csv" | "json" = "csv",
  ) => {
    const res = await axiosInstance.get(ENDPOINTS.AUDIT_AGGREGATOR.EXPORT, {
      params: { ...params, format },
      responseType: "blob",
    });

    const blob = new Blob([res.data], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `audit-export-${new Date().toISOString().slice(0, 10)}.${format}`,
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  replay: (params?: AuditReplayPayload) =>
    axiosInstance.post<CommonResponse<object>>(
      ENDPOINTS.AUDIT_AGGREGATOR.REPLAY,
      null,
      { params },
    ),

  getReplayJob: (jobId: string) =>
    axiosInstance.get<CommonResponse<AuditReplayJobDto>>(
      ENDPOINTS.AUDIT_AGGREGATOR.REPLAY_JOB(jobId),
    ),

  redact: (accountId: string) =>
    axiosInstance.post<CommonResponse<object>>(
      ENDPOINTS.AUDIT_AGGREGATOR.REDACT,
      null,
      { params: { accountId } },
    ),
};
