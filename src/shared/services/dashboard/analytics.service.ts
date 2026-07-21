import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  AmbientTrendPoint,
  AssetLifecycleRow,
  BatteryDashboardStatsDto,
  BatteryHealthByTypeRow,
  DashboardStatsParams,
  EnvIncidentReportParams,
  EnvironmentalIncidentRow,
  ReportFormat,
  ReportTimeSeriesParams,
  ReportTimeSeriesPoint,
  TopAnomaliesParams,
  TopAnomalyRow,
  WarrantyExpiringParams,
  WarrantyExpiringRow,
} from "@/shared/types/dashboard/analytics.types";

export const analyticsService = {
  // Dashboard stats — không hỗ trợ export (không có ?format).
  getDashboardStats: (params?: DashboardStatsParams) =>
    axiosInstance.get<CommonResponse<BatteryDashboardStatsDto>>(
      ENDPOINTS.BATTERY_DASHBOARD.STATS,
      { params },
    ),

  // ── Reports (JSON) ──────────────────────────────────────────────────────
  getBatteryHealthByType: () =>
    axiosInstance.get<CommonResponse<BatteryHealthByTypeRow[]>>(
      ENDPOINTS.REPORTS.BATTERY_HEALTH_BY_TYPE,
    ),
  getAlertVolume: (params?: ReportTimeSeriesParams) =>
    axiosInstance.get<CommonResponse<ReportTimeSeriesPoint[]>>(
      ENDPOINTS.REPORTS.ALERT_VOLUME,
      { params },
    ),
  getTopAnomalies: (params?: TopAnomaliesParams) =>
    axiosInstance.get<CommonResponse<TopAnomalyRow[]>>(
      ENDPOINTS.REPORTS.TOP_ANOMALIES,
      { params },
    ),
  getAssetLifecycle: () =>
    axiosInstance.get<CommonResponse<AssetLifecycleRow[]>>(
      ENDPOINTS.REPORTS.ASSET_LIFECYCLE,
    ),
  getWarrantyExpiring: (params?: WarrantyExpiringParams) =>
    axiosInstance.get<CommonResponse<WarrantyExpiringRow[]>>(
      ENDPOINTS.REPORTS.WARRANTY_EXPIRING,
      { params },
    ),
  getEnvironmentalIncidents: (params?: EnvIncidentReportParams) =>
    axiosInstance.get<CommonResponse<EnvironmentalIncidentRow[]>>(
      ENDPOINTS.REPORTS.ENVIRONMENTAL_INCIDENTS,
      { params },
    ),
  getAmbientTrend: (params?: ReportTimeSeriesParams) =>
    axiosInstance.get<CommonResponse<AmbientTrendPoint[]>>(
      ENDPOINTS.REPORTS.AMBIENT_TREND,
      { params },
    ),

  // ── Export (blob) ───────────────────────────────────────────────────────
  // BE trả file khi có ?format=csv|xlsx. Dùng chung cho mọi report.
  exportReport: (
    endpoint: string,
    format: ReportFormat,
    params?: Record<string, unknown>,
  ) =>
    axiosInstance.get<Blob>(endpoint, {
      params: { ...params, format },
      responseType: "blob",
    }),
};
