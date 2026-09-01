// ThresholdConfig — alert thresholds per BatteryType. Reads are shared by
// admin/manager (telemetry colouring). The upsert payload is admin-only but kept
// in the same type file.
export interface ThresholdConfigDto {
  id: string;
  batteryTypeId: string;
  batteryTypeName: string;
  // ⚠️ Min/Max ở đây nghĩa là WARNING/CRITICAL, không phải hai đầu một dải an toàn:
  // vượt `voltageMin` là Warning, vượt `voltageMax` là Critical. Tên cột giữ nguyên để khỏi
  // phá hợp đồng API. Xem `AnomalyRules.Detect` phía BE.
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  currentMaxCharge?: number;
  currentMaxDischarge?: number;
  sohWarningThreshold?: number;
  sohCriticalThreshold?: number;
  effectiveFromUtc: string;
  isActive: boolean;
}

export interface ThresholdListParams {
  pageNumber?: number;
  pageSize?: number;
  batteryTypeId?: string;
  isActive?: boolean;
}

export interface ThresholdByTypeParams {
  includeInactive?: boolean;
}

export interface UpsertThresholdPayload {
  // ⚠️ Min/Max ở đây nghĩa là WARNING/CRITICAL, không phải hai đầu một dải an toàn:
  // vượt `voltageMin` là Warning, vượt `voltageMax` là Critical. Tên cột giữ nguyên để khỏi
  // phá hợp đồng API. Xem `AnomalyRules.Detect` phía BE.
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  currentMaxCharge?: number;
  currentMaxDischarge?: number;
  sohWarningThreshold?: number;
  sohCriticalThreshold?: number;
  effectiveFromUtc?: string;
}
