import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alert.enum";

export {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alert.enum";

export interface AlertDto {
  id: string;
  // Chuỗi rỗng "" (KHÔNG phải null) cho alert cấp SITE — ambient (HighAmbientTemp/
  // HighHumidity/HighTempHumidityCombo) hoặc EnvironmentalIncident. Khi đó dùng `siteId`.
  batteryAssetId: string;
  batterySerialNumber: string;
  // Non-null cho alert cấp site; null với alert gắn 1 pin cụ thể.
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
