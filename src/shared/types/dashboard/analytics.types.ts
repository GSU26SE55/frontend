import type { ReportGranularityEnum } from "@/shared/enums/dashboard/report.enum";
export {
  ReportGranularityEnum,
  ReportFormat,
} from "@/shared/enums/dashboard/report.enum";

// ─────────────────────────────────────────────────────────────────────────────
// A. Battery Dashboard stats — GET /api/battery/dashboard/stats
//    Note: enums come back as an `int + *Name` pair (the BE maps the name) → render *Name directly.
// ─────────────────────────────────────────────────────────────────────────────

export interface AssetStatusBucketDto {
  status: number;
  statusName: string;
  count: number;
}

export interface SohBucketDto {
  healthy: number; // ≥90%
  normal: number; // 80–89%
  warning: number; // 75–79%
  eol: number; // <75%
  unknown: number; // no SOH reading yet
}

export interface AlertSeverityBreakdownDto {
  critical: number;
  warning: number;
  info: number;
}

export interface AlertByTypeDto {
  anomalyType: number;
  anomalyName: string;
  count: number;
}

export interface DailyTrendPointDto {
  date: string; // DateOnly "yyyy-MM-dd"
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export interface AmbientTrendHourPointDto {
  hourUtc: string; // ISO datetime UTC
  avgTemperature: number | null;
  avgHumidity: number | null;
  avgSolarIrradiance: number | null;
}

export interface SensorAggregateDto {
  avgVoltage: number | null;
  avgCurrent: number | null;
  avgTemperature: number | null;
  avgSoc: number | null;
  avgSoh: number | null;
  readingsCount: number;
}

export interface TopAlertingAssetDto {
  batteryAssetId: string;
  serialNumber: string;
  alertCount: number;
  criticalCount: number;
}

export interface EnvironmentalIncidentByTypeDto {
  incidentType: number;
  incidentName: string;
  count: number;
}

export interface ChemistryBucketDto {
  chemistry: number;
  chemistryName: string;
  assetCount: number;
}

export interface BatteryDashboardStatsDto {
  totalAssets: number;
  activeAssets: number;
  offlineAssets: number;
  openAlerts: number;
  openAlertsCritical: number;
  openAlertsWarning: number;
  openEnvironmentalIncidents: number;
  sites: number;
  assetStatusDistribution: AssetStatusBucketDto[];
  sohDistribution: SohBucketDto;
  alertSeverityBreakdown: AlertSeverityBreakdownDto;
  openAlertsByType: AlertByTypeDto[];
  alertTrend7Days: DailyTrendPointDto[];
  ambientTrend24Hours: AmbientTrendHourPointDto[];
  sensorAggregate24Hours: SensorAggregateDto;
  topAlertingAssets: TopAlertingAssetDto[];
  environmentalIncidentsByType: EnvironmentalIncidentByTypeDto[];
  chemistryDistribution: ChemistryBucketDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Report rows — GET /api/reports/*
//    Note: enum-name fields come back as STRINGS (not ints) → declare them `string`.
// ─────────────────────────────────────────────────────────────────────────────

export interface BatteryHealthByTypeRow {
  typeId: string;
  name: string | null;
  totalAssets: number;
  withActiveAlerts: number;
  healthScore: number; // 0–100
}

export interface ReportTimeSeriesPoint {
  date: string; // DateTime UTC
  count: number;
}

export interface TopAnomalyRow {
  anomalyType: string; // enum name, e.g. "Overheat"
  count: number;
  criticalCount: number;
}

export interface AssetLifecycleRow {
  assetId: string;
  serialNumber: string | null;
  ageDays: number;
  cycleCount: number | null;
  alertsTotal: number;
}

export interface WarrantyExpiringRow {
  assetId: string;
  serialNumber: string | null;
  warrantyEndDate: string | null;
  daysRemaining: number | null;
  customerId: string;
}

export interface EnvironmentalIncidentRow {
  siteId: string;
  incidentType: string; // enum name
  severity: string; // enum name
  detectedAt: string;
  resolvedAt: string | null;
  durationHours: number | null;
  wasFalseAlarm: boolean;
}

// ⚠️ DIFFERENT from AmbientTrendHourPointDto (dashboard/stats) — a completely different shape.
export interface AmbientTrendPoint {
  date: string; // DateTime UTC (bucketed by granularity)
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  humidityAvg: number | null;
  irradianceAvg: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Filter / query params
// ─────────────────────────────────────────────────────────────────────────────

// Filter bar state — shared by the dashboard stats and the reports.
export interface AnalyticsFilter {
  siteId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  granularity?: ReportGranularityEnum;
}

export interface DashboardStatsParams {
  siteId?: string;
}

// Report time-series (alert-volume, ambient-trend) — ambient-trend requires siteId.
export interface ReportTimeSeriesParams {
  siteId?: string;
  from?: string;
  to?: string;
  granularity?: ReportGranularityEnum;
}

export interface TopAnomaliesParams {
  from?: string;
  to?: string;
  limit?: number; // default 10, max 100
}

export interface WarrantyExpiringParams {
  within?: string; // e.g. "90d" or a number of days
}

// type: int = EnvironmentalIncidentTypeEnum — NOT bound in the UI this sprint (empty = all).
export interface EnvIncidentReportParams {
  siteId?: string;
  from?: string;
  to?: string;
  type?: number;
}
