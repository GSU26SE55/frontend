import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketReportParams,
  SlaByStaffDto,
  SlaByPriorityDto,
  TicketVolumeDto,
  TopReopenIssueDto,
  StaffPerformanceDto,
  CsatDto,
  ResolutionHistogramDto,
  CategoryBreakdownDto,
  SagaFailedRateDto,
} from "@/shared/types/ticket-report.types";

export const ticketReportService = {
  getSlaByStaff: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<SlaByStaffDto[]>>(
      ENDPOINTS.REPORTS.SLA_BY_STAFF,
      { params },
    ),

  getSlaByPriority: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<SlaByPriorityDto[]>>(
      ENDPOINTS.REPORTS.SLA_BY_PRIORITY,
      { params },
    ),

  getTicketVolume: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<TicketVolumeDto[]>>(
      ENDPOINTS.REPORTS.TICKET_VOLUME,
      { params },
    ),

  getTopReopenIssues: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<TopReopenIssueDto[]>>(
      ENDPOINTS.REPORTS.TOP_REOPEN_ISSUES,
      { params },
    ),

  getStaffPerformance: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<StaffPerformanceDto[]>>(
      ENDPOINTS.REPORTS.STAFF_PERFORMANCE,
      { params },
    ),

  getCsat: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<CsatDto[]>>(ENDPOINTS.REPORTS.CSAT, {
      params,
    }),

  getResolutionTimeHistogram: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<ResolutionHistogramDto[]>>(
      ENDPOINTS.REPORTS.RESOLUTION_TIME_HISTOGRAM,
      { params },
    ),

  getCategoryBreakdown: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<CategoryBreakdownDto[]>>(
      ENDPOINTS.REPORTS.CATEGORY_BREAKDOWN,
      { params },
    ),

  getSagaFailedRate: (params?: TicketReportParams) =>
    axiosInstance.get<CommonResponse<SagaFailedRateDto[]>>(
      ENDPOINTS.REPORTS.SAGA_FAILED_RATE,
      { params },
    ),
};
