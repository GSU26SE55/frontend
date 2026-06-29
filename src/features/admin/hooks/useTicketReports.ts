import { useQuery } from "@tanstack/react-query";
import { ticketReportService } from "@/features/admin/services/report.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { TicketReportParams } from "@/shared/types/ticket-report.types";

const REPORT_STALE = 5 * 60_000;

export const useSlaByStaff = (params?: TicketReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.slaByStaff(params),
    queryFn: () =>
      ticketReportService.getSlaByStaff(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useSlaByPriority = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.slaByPriority(params),
    queryFn: () =>
      ticketReportService.getSlaByPriority(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useTicketVolume = (params?: TicketReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.ticketVolume(params),
    queryFn: () =>
      ticketReportService.getTicketVolume(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useTopReopenIssues = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.topReopenIssues(params),
    queryFn: () =>
      ticketReportService.getTopReopenIssues(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useStaffPerformance = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.staffPerformance(params),
    queryFn: () =>
      ticketReportService.getStaffPerformance(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useCsat = (params?: TicketReportParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.csat(params),
    queryFn: () =>
      ticketReportService.getCsat(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useResolutionTimeHistogram = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.resolutionTimeHistogram(params),
    queryFn: () =>
      ticketReportService
        .getResolutionTimeHistogram(params)
        .then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useCategoryBreakdown = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.categoryBreakdown(params),
    queryFn: () =>
      ticketReportService.getCategoryBreakdown(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useSagaFailedRate = (
  params?: TicketReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.sagaFailedRate(params),
    queryFn: () =>
      ticketReportService.getSagaFailedRate(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });
