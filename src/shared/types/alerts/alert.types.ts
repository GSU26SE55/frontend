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
