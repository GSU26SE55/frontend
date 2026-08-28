import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";

export {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";

export interface AlertDto {
  id: string;
  // Empty string "" (NOT null) for SITE-level alerts — ambient (HighAmbientTemp/
  // HighHumidity/HighTempHumidityCombo) or EnvironmentalIncident. Use `siteId` in
  // that case.
  batteryAssetId: string;
  batterySerialNumber: string;
  /**
   * Device-level alerts (DeviceOffline, IotDataIntegrityViolation) carry no battery, so these
   * are what identifies them. Empty string for battery/site alerts — same convention as
   * `batterySerialNumber`.
   */
  iotDeviceId: string | null;
  iotDeviceCode: string;
  iotDeviceName: string;
  /** Site the alert belongs to. Empty when the alert has no site. */
  siteName: string;
  /**
   * Customer who owns this alert — resolved by the BE from BatteryAsset.CustomerId
   * (battery-level) or Site.CustomerId (site-level). Empty string when the account cannot
   * be resolved, so render a dash rather than assuming a name is always present.
   */
  customerName: string;
  // Non-null for site-level alerts; null for alerts tied to one specific battery.
  siteId: string | null;
  anomalyType: AnomalyTypeEnum;
  severity: AlertSeverityEnum;
  thresholdValue: number | null;
  actualValue: number | null;
  unit: string | null;
  detectedAt: string;
  status: AlertStatusEnum;
  ticketId?: string | null;
  acknowledgedByUserId?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  dedupWindowEndUtc: string;
  createdAt: string;
}

export interface AlertListParams {
  pageNumber?: number;
  pageSize?: number;
  batteryAssetId?: string;
  severity?: AlertSeverityEnum;
  status?: AlertStatusEnum;
  anomalyType?: AnomalyTypeEnum;
  // Drops the mirror alert the BE writes alongside every EnvironmentalIncident. That row
  // belongs to the Environmental incidents screen, so the battery alert list asks the BE
  // to leave it out — filtering it client-side instead would skew totalItems/pagination.
  // Ignored by the BE when `anomalyType` is also sent.
  excludeEnvironmentalIncidents?: boolean;
  // Keeps the Battery alerts and Device alerts lists disjoint. `iotOnly` returns ONLY
  // DeviceOffline + IotDataIntegrityViolation (the Device alerts screen); its opposite drops
  // them (the Battery alerts screen). Filtering server-side rather than client-side, because
  // filtering a page after the BE has already cut it skews totalItems and pagination.
  // Both are ignored by the BE when `anomalyType` is also sent.
  iotOnly?: boolean;
  excludeIotDeviceAlerts?: boolean;
  from?: string;
  to?: string;
}

export interface AiPrescriptionDto {
  prescription: string;
  actionSteps: string[];
  ppeRequired: string[];
  sopReferences: string[];
  safetyWarnings: string[];
  escalationConditions: string[];
  humanVerificationRequired: boolean;
  enriched: boolean;
  llmProvider: string;
  blocked: boolean;
  cached: boolean;
  prescriptionId: string | null;
}

export interface SubmitPrescriptionFeedbackCommand {
  status: "accepted" | "edited" | "rejected";
  editedSteps?: string[] | null;
  note?: string | null;
}
