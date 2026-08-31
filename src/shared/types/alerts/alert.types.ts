import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";
import type { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";

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
  // Set only when this alert is the copy written alongside an EnvironmentalIncident. That copy
  // carries no measurement, so `anomalyType` alone renders every incident — gas leak, flood,
  // fire — as the same meaningless "Environmental incident / 0 incident" row. These two fields
  // are what let the Environmental screen show the real type and open the incident's detail.
  environmentalIncidentId: string | null;
  incidentType: EnvironmentalIncidentTypeEnum | null;
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
  // Excludes alerts with status = Merged. BE defaults this to true, so the FE only needs to
  // pass it to explicitly opt into seeing merged alerts.
  excludeMerged?: boolean;
  anomalyType?: AnomalyTypeEnum;
  // Drops EVERY site-level alert (no battery attached): the mirror alert written alongside each
  // EnvironmentalIncident, plus ambient threshold breaches (temperature / humidity / gas). Those
  // belong to the Environmental alerts screen, so the battery list asks the BE to leave them out —
  // filtering client-side instead would skew totalItems/pagination.
  // Ignored by the BE when `anomalyType` is also sent.
  excludeEnvironmentalIncidents?: boolean;
  // Opposite of the above: ONLY site-level alerts, for the "Threshold breaches" table on the
  // Environmental alerts screen. Device alerts carry no battery either, so the BE also subtracts
  // them here — otherwise a gateway alert would show under Environment and be counted twice.
  siteLevelOnly?: boolean;
  // Site-level alerts have no battery, so `batteryAssetId` cannot narrow them — the Environmental
  // screen's site dropdown filters on this instead.
  siteId?: string;
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
