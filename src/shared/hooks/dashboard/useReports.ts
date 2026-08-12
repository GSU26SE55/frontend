import { useMutation, useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/shared/services/dashboard/analytics.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  EnvIncidentReportParams,
  ReportFormat,
  ReportTimeSeriesParams,
  TopAnomaliesParams,
  WarrantyExpiringParams,
} from "@/shared/types/dashboard/analytics.types";

// Reports change infrequently → staleTime 5 min. Each hook accepts `enabled` to lazy-load per active tab.
const REPORT_STALE = 5 * 60_000;

export const useBatteryHealthByType = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.batteryHealthByType(),
    queryFn: () =>
      analyticsService.getBatteryHealthByType().then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useAlertVolume = (
  params?: ReportTimeSeriesParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.alertVolume(params),
    queryFn: () =>
      analyticsService.getAlertVolume(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useTopAnomalies = (params?: TopAnomaliesParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.topAnomalies(params),
    queryFn: () =>
      analyticsService.getTopAnomalies(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useAssetLifecycle = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.reports.assetLifecycle(),
    queryFn: () =>
      analyticsService.getAssetLifecycle().then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useWarrantyExpiring = (
  params?: WarrantyExpiringParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.warrantyExpiring(params),
    queryFn: () =>
      analyticsService.getWarrantyExpiring(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useEnvironmentalIncidentsReport = (
  params?: EnvIncidentReportParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.environmentalIncidents(params),
    queryFn: () =>
      analyticsService
        .getEnvironmentalIncidents(params)
        .then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

export const useAmbientTrend = (
  params?: ReportTimeSeriesParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.reports.ambientTrend(params),
    queryFn: () =>
      analyticsService.getAmbientTrend(params).then((r) => r.data.data),
    staleTime: REPORT_STALE,
    enabled,
  });

// ── Export ──────────────────────────────────────────────────────────────────
interface ExportReportInput {
  endpoint: string;
  format: ReportFormat;
  filename: string; // without extension
  params?: Record<string, unknown>;
}

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

// Downloads the report file (CSV/XLSX). On error → interceptor re-parses the blob as JSON → toast.
export const useExportReport = () =>
  useMutation({
    mutationFn: async ({
      endpoint,
      format,
      filename,
      params,
    }: ExportReportInput) => {
      const res = await analyticsService.exportReport(endpoint, format, params);
      triggerBlobDownload(res.data, `${filename}.${format}`);
    },
    onError: (error) => handleErrorApi({ error }),
  });
